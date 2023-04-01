import {useEffect, useState} from 'react'
import './App.css'
import * as te from 'tw-elements';


function App() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState([]);
    const [fileOffcanvas, setOffcanvas] = useState("")
    const [activeTab, setActiveTab] = useState("prepare")
    const [currentProject, setCurrentProject] = useState({})
    const [files, setFiles] = useState({})

    useEffect(() => {
        const myOffcanvas = new te.Offcanvas(
            document.getElementById("files"),
        );
        setOffcanvas(myOffcanvas)
    }, []);

    // useEffect(() => {
    //     console.log(files);
    // }, [files]);

    const updateStageFiles = (projectId, stage, newProject = false) => {
        const getStageInfo = async (projectId, stage) => {
            setLoading(prevState => {
                    const newArray = [...prevState]
                    newArray.push("stage")
                    return newArray
                }
            )
            const response = await fetch(`files/${stage}-detail/${projectId}`)
            setLoading(prevState => {
                return prevState.filter((element) => element !== "stage")
            })
            return response.json()
        }

        const extractFiles = (json, attr) => {
            let result = [];

            const traverse = (obj) => {
                for (let key in obj) {
                    if (typeof obj[key] === "object" && obj[key] !== null) {
                        traverse(obj[key]);
                    } else {
                        if (key === attr) {
                            result.push({
                                "fileId": obj[key],
                                "fileName": obj["fileName"],
                                "uploadTime": obj["uploadTime"]
                            });
                        }
                    }
                }
            }

            traverse(json);
            return result;
        }

        let currentFiles = newProject ? {} : {...files}

        const info = getStageInfo(projectId, stage)
        info.then(info => {
            currentFiles[stage] = extractFiles(info, "fileId")
            setFiles(currentFiles)
        })
    }

    const showFileOffcanvas = (projectId, projectName) => {
        if (currentProject.id === undefined) {
            setCurrentProject({name: projectName, id: projectId})
            fileOffcanvas.show()
            return
        }
        if (currentProject.id === projectId) {
            fileOffcanvas.toggle()
            return
        }
        if (currentProject.id !== projectId) {
            setCurrentProject({name: projectName, id: projectId})
            fileOffcanvas.show()
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (query === "") {
            setResults([])
            return
        }
        setLoading(prevState => {
            const newArray = [...prevState]
            newArray.push("search")
            return newArray
        });
        // await sleep(2000);
        // console.log(loading)
        // TODO:当请求出错时提示
        const response = await fetch(`api/search?query=${query}`);
        // const response = await fetch(`https://ppp-downloader-worker.aguo.workers.dev?query=${query}`);
        const data = await response.json();
        // TODO:error
        if (data.hasOwnProperty("error")) {
            setResults([])
        } else {
            setResults(data);
        }
        setLoading(prevState => {
            return prevState.filter((element) => element !== "search")
        })
    };

    const handleResultClick = async (e) => {
        e.preventDefault();
        const projectId = e.target.getAttribute("data-id")
        const projectName = e.target.getAttribute("data-name")
        if (currentProject.id !== projectId) {
            // await sleep(2000)
            updateStageFiles(projectId, activeTab, true)
        }
        showFileOffcanvas(projectId, projectName)
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const handleTabClick = async (e) => {
        e.preventDefault();
        const tab = e.target.getAttribute("data-te-target")
        const stage = tab.split("-").pop()
        setActiveTab(stage)
        updateStageFiles(currentProject.id, stage)
    }
    return (
        <div className="App flex bg-np-white"
             style={{height: "100vh", width: "100vw"}}>
            <div className="container mx-auto h-full flex justify-center flex-wrap content-center">
                <div className="flex justify-center w-full">
                    <div className="mb-3 sm:8/12 md:w-7/12 lg:w-6/12 xl:w-4/12">
                        <form onSubmit={handleSubmit}>
                            <div className="relative mb-4 flex w-full flex-wrap items-stretch">
                                <input
                                    type="search"
                                    className="shadow-np-input h-14 relative m-0 block w-[1%] min-w-0 flex-auto rounded-[0.8rem] px-3 py-1.5 text-base font-normal text-neutral-700 outline-none border-2"
                                    placeholder="Search"
                                    aria-label="Search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}/>
                            </div>
                        </form>
                        <Loading loading={loading.includes("search")}/>
                        <div className="flex justify-center w-full">
                            <ul>
                                {results.map((result) => (
                                    <li key={`key-${result.id}`}
                                        className="w-full p-4 hover:rounded-lg hover:bg-primary-100 hover:text-primary-600">
                                        <a data-id={result.id} data-name={result.name}
                                           onClick={handleResultClick}>{result.name}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div
                className="bg-np-card invisible fixed bottom-0 top-0 right-0 z-[1045] flex sm:w-full md:w-10/12 lg:w-7/12 xl:w-6/12 max-w-full translate-x-full flex-col rounded-l-[2rem] bg-clip-padding text-neutral-700 outline-none transition duration-300 ease-in-out [&[data-te-offcanvas-show]]:transform-none"
                style={{boxShadow: "0px 0px 3px 0px #e7e4e4, -3px 3px 3px 0px #cec6c6"}}
                tabIndex="-1" id="files" aria-labelledby="files" data-te-offcanvas-init={true}>
                <div className="flex items-center justify-between mt-8 p-4">
                    <h5
                        className="mb-0 font-semibold leading-normal"
                        id="offcanvasRightLabel">
                        {currentProject.name}
                    </h5>
                    <button type="button"
                            className="box-content rounded-none border-none opacity-50 hover:no-underline hover:opacity-75 focus:opacity-100 focus:shadow-none focus:outline-none"
                            data-te-offcanvas-dismiss={true}>
                            <span
                                className="w-[1em] focus:opacity-100 disabled:pointer-events-none disabled:select-none disabled:opacity-25 [&.disabled]:pointer-events-none [&.disabled]:select-none [&.disabled]:opacity-25">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                     strokeWidth="1.5" stroke="currentColor"
                                     className="h-6 w-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </span>
                    </button>
                </div>
                <ul className="flex list-none flex-col flex-wrap border-b-0 pl-0 md:flex-row"
                    role="tablist" id="stage" data-te-nav-ref={true}>
                    <li role="presentation">
                        <a
                            href="#tabs-prepare"
                            className="my-2 block border-x-0 border-t-0 border-b-2 border-transparent px-7 pt-4 pb-3.5 text-xs font-medium uppercase leading-tight text-neutral-500 hover:isolate hover:border-transparent hover:bg-neutral-100 focus:isolate focus:border-transparent data-[te-nav-active]:border-primary data-[te-nav-active]:text-primary dark:text-neutral-400 dark:hover:bg-transparent dark:data-[te-nav-active]:border-primary-400 dark:data-[te-nav-active]:text-primary-400"
                            data-te-toggle="pill"
                            data-te-target="#tabs-prepare"
                            data-te-nav-active={true}
                            role="tab"
                            aria-controls="tabs-prepare"
                            aria-selected="true" onClick={handleTabClick}>准备</a>
                    </li>
                    <li role="presentation">
                        <a
                            href="#tabs-procurement"
                            className="focus:border-transparen my-2 block border-x-0 border-t-0 border-b-2 border-transparent px-7 pt-4 pb-3.5 text-xs font-medium uppercase leading-tight text-neutral-500 hover:isolate hover:border-transparent hover:bg-neutral-100 focus:isolate data-[te-nav-active]:border-primary data-[te-nav-active]:text-primary dark:text-neutral-400 dark:hover:bg-transparent dark:data-[te-nav-active]:border-primary-400 dark:data-[te-nav-active]:text-primary-400"
                            data-te-toggle="pill"
                            data-te-target="#tabs-procurement"
                            role="tab"
                            aria-controls="tabs-procurement"
                            aria-selected="false"
                            onClick={handleTabClick}>采购</a>
                    </li>
                    <li role="presentation">
                        <a
                            href="#tabs-perform"
                            className="my-2 block border-x-0 border-t-0 border-b-2 border-transparent px-7 pt-4 pb-3.5 text-xs font-medium uppercase leading-tight text-neutral-500 hover:isolate hover:border-transparent hover:bg-neutral-100 focus:isolate focus:border-transparent data-[te-nav-active]:border-primary data-[te-nav-active]:text-primary dark:text-neutral-400 dark:hover:bg-transparent dark:data-[te-nav-active]:border-primary-400 dark:data-[te-nav-active]:text-primary-400"
                            data-te-toggle="pill"
                            data-te-target="#tabs-perform"
                            role="tab"
                            aria-controls="tabs-perform"
                            aria-selected="false"
                            onClick={handleTabClick}>执行</a>
                    </li>
                </ul>
                <Loading loading={loading.includes("stage")}/>
                <div className="offcanvas-body flex-grow p-4 overflow-x-hidden overflow-y-auto">
                    <div className="">
                        <div
                            className="hidden opacity-0 opacity-100 transition-opacity duration-150 ease-linear data-[te-tab-active]:block"
                            id="tabs-prepare"
                            role="tabpanel"
                            aria-labelledby="tabs-prepare-tab"
                            data-te-tab-active={true}>
                            <div className="flex flex-col overflow-x-hidden">
                                <div className="sm:-mx-6 lg:-mx-8">
                                    <div className="inline-block min-w-full py-2 sm:px-6 lg:px-8">
                                        <FilesTable files={files.prepare}/>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div
                            className="hidden opacity-0 transition-opacity duration-150 ease-linear data-[te-tab-active]:block"
                            id="tabs-procurement" role="tabpanel" aria-labelledby="tabs-procurement-tab">
                            <div className="flex flex-col overflow-x-hidden">
                                <div className="sm:-mx-6 lg:-mx-8">
                                    <div className="inline-block min-w-full py-2 sm:px-6 lg:px-8">
                                        <FilesTable files={files.procurement}/>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div
                            className="hidden opacity-0 transition-opacity duration-150 ease-linear data-[te-tab-active]:block"
                            id="tabs-perform" role="tabpanel" aria-labelledby="tabs-perform-tab">
                            <div className="flex flex-col overflow-x-hidden">
                                <div className="sm:-mx-6 lg:-mx-8">
                                    <div className="inline-block min-w-full py-2 sm:px-6 lg:px-8">
                                        <FilesTable files={files.perform}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


const Loading = (props) => {
    if (props.loading) {
        return (
            <div className="flex justify-center">
                <div
                    className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status">
                            <span
                                className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                </div>
            </div>
        )
    }
}

const FilesTable = (props) => {
    const generateDownloadUrl = (fileId) => {
        const baseUrl = "https://www.cpppc.org:8082/api/pdfs/front/download/"
        const fileUrl = new URL(fileId, baseUrl)
        fileUrl.searchParams.set("token", "null")
        fileUrl.searchParams.set("appId", "public")
        return fileUrl.href
    }

    const files = props.files
    return (
        <table
            className="min-w-full text-left text-sm font-light overflow-x-hidden overflow-y-auto">
            <thead className="border-b font-medium">
            <tr>
                <th scope="col" className="px-4 py-4">FileName</th>
                <th scope="col" className="px-2 py-4">UploadTime</th>
                <th scope="col" className="pl-4 pr-2 py-4"></th>
            </tr>
            </thead>
            <tbody className="">
            {files !== undefined &&
                files.map((file) => (
                    <tr key={`${file.fileId}-${Math.random()}`} className="">
                        <td className="px-4 py-4 text-wrap">{file.fileName}</td>
                        <td className="whitespace-nowrap px-2 py-4 text-xs">{file.uploadTime}</td>
                        <td className="whitespace-nowrap pl-4 pr-2 py-4 text-primary">
                            <a href={generateDownloadUrl(file.fileId)}
                               target={"_blank"}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                     viewBox="0 0 24 24" strokeWidth="1.5"
                                     stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                                </svg>
                            </a>
                        </td>
                    </tr>
                ))
            }
            {files !== undefined && files.length === 0 && (
                <tr>
                    <td>"没有发现相关文件"</td>
                </tr>
            )}
            </tbody>
        </table>
    )
}

export default App