import * as Realm from 'realm-web';


export default {
    async fetch(request, env) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
            "Access-Control-Max-Age": "86400",
        };

        async function handleRequest(request,dest) {
            const url = new URL(request.url);

            // Rewrite request to point to API URL. This also makes the request mutable
            // ,so you can add the correct Origin header to make the API server think
            // that this request is not cross-site.
            request = new Request(dest, request);
            request.headers.set("Origin", new URL(dest).origin);
            let response = await fetch(request);
            // Recreate the response so you can modify the headers

            response = new Response(response.body, response);
            // Set CORS headers

            response.headers.set("Access-Control-Allow-Origin", url.origin);

            // Append to/Add Vary header so browser will cache response correctly
            response.headers.append("Vary", "Origin");

            return response;
        }

        async function handleOptions(request) {
            if (
                request.headers.get("Origin") !== null &&
                request.headers.get("Access-Control-Request-Method") !== null &&
                request.headers.get("Access-Control-Request-Headers") !== null
            ) {
                // Handle CORS preflight requests.
                return new Response(null, {
                    headers: {
                        ...corsHeaders,
                        "Access-Control-Allow-Headers": request.headers.get(
                            "Access-Control-Request-Headers"
                        ),
                    },
                });
            } else {
                // Handle standard OPTIONS request.
                return new Response(null, {
                    headers: {
                        Allow: "GET, HEAD, POST, OPTIONS",
                    },
                });
            }
        }


        let requestUrl = new URL(request.url)
        if (requestUrl.pathname.startsWith('/api/search')) {
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
                return new Response(JSON.stringify({error: "Remote query failed"}), {
                    headers: {
                        "content-type": "application/json;charset=UTF-8",
                    },
                })
            }
        }
        if (requestUrl.pathname.startsWith('/api/files')) {
            const base = "https://www.cpppc.org:8082";
            const newPath = requestUrl.pathname.replace("/api/files", "/api/pub/project")
            const destinationURL = new URL(newPath, base)
            // const statusCode = 301;
            // return Response.redirect(destinationURL, statusCode);

            if (request.method === "OPTIONS") {
                // Handle CORS preflight requests
                return handleOptions(request);
            } else if (
                request.method === "GET" ||
                request.method === "HEAD" ||
                request.method === "POST"
            ) {
                // Handle requests to the API server
                return handleRequest(request,destinationURL);
            } else {
                return new Response(null, {
                    status: 405,
                    statusText: "Method Not Allowed",
                });
            }

        }
        return env.ASSETS.fetch(request);
    },
};