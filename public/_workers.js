import * as Realm from 'realm-web';


export default {
    async fetch(request, env) {
        let requestUrl = new URL(request.url)
        if(requestUrl.pathname.startsWith('/api/')){
            let name = requestUrl.searchParams.get("query")
            // TODO: 根据更多的params 生成更多的查询表达式 eg:指定industry的情况下，给予industry更高的权重
            if (name === null || name.length === 0) {
                return new Response(JSON.stringify({error: "no keywords"}))
            }
            const app = new Realm.App({id: env.APP_ID});
            const credentials = Realm.Credentials.apiKey(env.API_KEY);
            try {
                const user = await app.logIn(credentials);
                const mongo = user.mongoClient(env.CLUSTER_NAME);
                const collection = mongo.db(env.DATABASE_NAME).collection(env.COLLECTION_NAME);
                const query = name
                const result = await collection.aggregate([
                    {
                        $search: {
                            index: "default",
                            compound: {
                                should: [
                                    {
                                        "text": {
                                            "query": query,
                                            "path": "content.proj_name",
                                            "score": {"boost": {"value": 10}}
                                        }
                                    },
                                    {
                                        "text": {
                                            "query": query,
                                            "path": "content.industry_required_name",
                                            "score": {"boost": {"value": 3}}
                                        }
                                    },
                                    {
                                        "text": {
                                            "query": query,
                                            "path": "content.industry_optional_name",
                                            "score": {"boost": {"value": 5}}
                                        }
                                    },
                                    {
                                        "text": {
                                            "query": query,
                                            "path": "content.dist_province_name",
                                            "score": {"boost": {"value": 2}}
                                        }
                                    },
                                    {
                                        "text": {
                                            "query": query,
                                            "path": "content.dist_city_name",
                                            "score": {"boost": {"value": 2}}
                                        }
                                    },
                                    {
                                        "text": {
                                            "query": query,
                                            "path": "content.dist_code_name",
                                            "score": {"boost": {"value": 2}}
                                        }
                                    },
                                    {
                                        "text": {
                                            "query": query,
                                            "path": "content.highlight.proj_survey",
                                            "score": {"boost": {"value": 1}}
                                        }
                                    },
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            "_id": 0,
                            "id": "$_id",
                            "name": "$content.proj_name",
                            "survey": {$arrayElemAt: ["$content.highlight.proj_survey", 0]},
                            "tag": 1,
                            "score": {"$meta": "searchScore"}
                        }
                    },
                    {$limit: 10}
                ])
                return new Response(JSON.stringify(result), {
                    headers: {
                        "content-type": "application/json;charset=UTF-8",
                    },
                })
            } catch (err) {
                return new Response(JSON.stringify(err), {
                    headers: {
                        "content-type": "application/json;charset=UTF-8",
                    },
                })
            }
        }
        return env.ASSETS.fetch(request);
    },
};
