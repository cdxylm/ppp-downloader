import * as Realm from 'realm-web';


export default {
    async fetch(request, env) {
        let requestUrl = new URL(request.url)
        if (requestUrl.pathname.startsWith('/api')) {
            const app = new Realm.App({id: env.APP_ID});
            const credentials = Realm.Credentials.apiKey(env.API_KEY);
            let user;
            let mongo
            try {
                user = await app.logIn(credentials);
                mongo = user.mongoClient(env.CLUSTER_NAME);
            } catch (e) {
                return new Response(JSON.stringify({error: "Failed to log in to the database"}))
            }
            if (requestUrl.pathname.startsWith('/api/search')) {
                let name = requestUrl.searchParams.get("query")
                // TODO: 根据更多的params 生成更多的查询表达式 eg:指定industry的情况下，给予industry更高的权重
                // TODO: 将查询抽象成函数，传递collection和表达式
                if (name === null || name.length === 0) {
                    return new Response(JSON.stringify({error: "no keywords"}))
                }
                try {
                    const collection = mongo.db(env.DATABASE_NAME).collection(env.COLLECTION_NAME_SEARCH);
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
                                                "path": "projName",
                                                "score": {"boost": {"value": 10}}
                                            }
                                        },
                                        {
                                            "text": {
                                                "query": query,
                                                "path": "industryRequiredName",
                                                "score": {"boost": {"value": 3}}
                                            }
                                        },
                                        {
                                            "text": {
                                                "query": query,
                                                "path": "industryOptionalName",
                                                "score": {"boost": {"value": 5}}
                                            }
                                        },
                                        {
                                            "text": {
                                                "query": query,
                                                "path": "distProvinceName",
                                                "score": {"boost": {"value": 2}}
                                            }
                                        },
                                        {
                                            "text": {
                                                "query": query,
                                                "path": "distCityName",
                                                "score": {"boost": {"value": 2}}
                                            }
                                        },
                                        {
                                            "text": {
                                                "query": query,
                                                "path": "distName",
                                                "score": {"boost": {"value": 2}}
                                            }
                                        },
                                        {
                                            "text": {
                                                "query": query,
                                                "path": "projSurvey",
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
                                "id": "$projRid",
                                "name": "$projName",
                                "survey": "$projSurvey",
                                // "tag": 1, TODO:字段缺失
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
                    console.log(err)
                    return new Response(JSON.stringify({error: "Remote query failed"}), {
                        headers: {
                            "content-type": "application/json;charset=UTF-8",
                        },
                    })
                }
            }
            if (requestUrl.pathname.startsWith('/api/files')) {
                /* 因为跨域问题不能使用redirect方式 [https://developers.cloudflare.com/workers/examples/redirect/]
                 而官方给出的跨域解决方案 [https://developers.cloudflare.com/workers/examples/cors-header-proxy/]
                 不适用于自定义https端口 [https://developers.cloudflare.com/workers/platform/known-issues/#custom-ports]
                 所以转向自己提供接口 */
                try {
                    const collection = mongo.db(env.DATABASE_NAME).collection(env.COLLECTION_NAME_FILES);
                    const rid = requestUrl.searchParams.get("project")
                    const stage = requestUrl.searchParams.get("stage").replace("-", "_")
                    //TODO:检查参数
                    const projection = {}
                    projection[stage] = 1
                    const result = await collection.findOne({_id: rid}, {projection: projection})
                    return new Response(JSON.stringify(result), {
                        headers: {
                            "content-type": "application/json;charset=UTF-8",
                        },
                    })
                } catch (err) {
                    console.log(err)
                    return new Response(JSON.stringify({error: "Remote query failed"}), {
                        headers: {
                            "content-type": "application/json;charset=UTF-8",
                        },
                    })
                }

            }
        }
        return env.ASSETS.fetch(request);
    },
};