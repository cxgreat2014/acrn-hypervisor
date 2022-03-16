
import {loadPyodide} from "./pyodide/pyodide.mjs"
import requirements from '../../requirements.txt'


let packageNames = []
requirements.split('\n').map((x) => {
    let packageName = x.trim();
    if (packageName.length > 0) {
        packageNames.push(packageName)
    }
})
console.log(packageNames)

function toJSONString(obj) {
    if (_.isString(obj)) {
        return JSON.stringify(obj)
    }
    return JSON.stringify(JSON.stringify(obj))
}


async function initPyodide() {
    let pyodide = await loadPyodide({
        indexURL: "/src/lib/pyodide",
    });
    await pyodide.loadPackage(['micropip'])
    console.log('a')
    await pyodide.runPythonAsync(
        `import micropip
import json
await micropip.install(${JSON.stringify(packageNames)})
`)
    await pyodide.loadPackage(packageNames)
    window.pyodide = pyodide
    return pyodide
}

function runPyCode(pythonCode) {
    pyodide.loadPackagesFromImports(pythonCode)
    return pyodide.runPython(pythonCode)
}

function writeFile(filename, content) {
    let file_content = JSON.stringify(content)
    return runPyCode(
        `import json; open(${toJSONString(filename)},'w',encoding='utf-8').write(json.loads(${toJSONString(file_content)}))`
    )
}

function readFile(filename) {
    return runPyCode(
        `open(${toJSONString(filename)},'r',encoding='utf-8').read()`
    )
}

function loadLibrary(libraryName, content) {
    return writeFile(`/lib/python3.9/${libraryName}.py`, content)
}

function validateXML(){

}
export {initPyodide, runPyCode, readFile, writeFile}