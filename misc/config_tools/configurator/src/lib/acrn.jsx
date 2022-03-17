import _ from "lodash";

import React, {Component} from "react";
import {path} from "@tauri-apps/api";
import scenario from '../assets/schema/scenario.json'
import {createSearchParams} from "react-router-dom";
import queryString from 'query-string'


function ThrowError(errMsg) {
    alert(errMsg)
    throw new Error(errMsg)
}

class EventBase extends Component {
    constructor(props) {
        super(props)
        this.funRegister = {}
        this.funRegisterID = 0
        this.eventName = {
            scenarioDataUpdate: 'scenarioDataUpdate'
        }
    }

    register = (eventName, fun) => {
        if (this.funRegister.hasOwnProperty(eventName)) {
            this.funRegisterID++
            this.funRegister[eventName][this.funRegisterID] = fun
            return this.funRegisterID
        }
    }

    unregister = (eventName, funRegisterID) => {
        if (this.funRegister.hasOwnProperty(eventName)) {
            if (this.funRegister[eventName].hasOwnProperty(funRegisterID)) {
                delete this.funRegister[eventName][funRegisterID]
            }
        }
    }

}


export class XMLLayer extends EventBase {
    constructor(helper) {
        super();
        this.helper = helper
        this.funRegister = {
            onScenarioLoad: []
        }
    }

    #parseXML = (XMLText) => {
        return (new DOMParser()).parseFromString(XMLText, "text/xml")
    }

    #validateBoardXMLText = boardXMLText => {
        // call inside
        try {
            let boardXML = this.#parseXML(boardXMLText, "text/xml");
            return !!boardXML.querySelector("BIOS_INFO")
        } catch (e) {
            return false
        }
    }

    #validateScenarioXMLText = (scenarioXMLText) => {
        // call inside
        try {
            let scenarioXML = this.#parseXML(scenarioXMLText);
            return !!scenarioXML.querySelector("acrn-config")
        } catch (e) {
            return false
        }
    }

    loadBoard = async (boardXMLPath) => {
        // call by program
        let boardXMLText = await this.helper.read(await this.helper.resolveHome(boardXMLPath))
        if (this.#validateBoardXMLText(boardXMLText)) {
            let PCIDevices = this.getPCIDevice(boardXMLText)
            return {boardXMLText, PCIDevices}
        } else {
            alert('Board XML Error!')
            return false
        }
    }

    loadScenario = async (scenarioXMLPath) => {
        // call by program
        // load scenario data from xml file
        let scenarioXMLText = await this.helper.read(await this.helper.resolveHome(scenarioXMLPath))
        if (!this.#validateScenarioXMLText(scenarioXMLText)) {
            ThrowError('Scenario XML Error!')
        }

        return this.helper.convertXMLTextToObj(scenarioXMLText)['acrn-config']
    }

    getPCIDevice = (boardXMLText) => {
        let pci_devices = this.#parseXML(boardXMLText).querySelector("PCI_DEVICE").textContent
        // Remove Region line
        pci_devices = pci_devices.replace(/Region.+\s+/g, '\n')
        // Remove Space
        pci_devices = pci_devices.replace(/[\n\t]+/g, '\n')
        // Split by \n
        pci_devices = pci_devices.split('\n')

        return _.uniq(pci_devices)
    }

    saveBoard = (boardFileWritePath, boardData) => {
        this.helper.save(boardFileWritePath, boardData)
    }

    saveScenario = (scenarioWritePath, scenarioData) => {
        // call by program
        console.log(scenarioData)
        const scenarioXML = this.helper.convertObjToXML({'acrn-config': scenarioData})
        console.log(scenarioXML)
        // debugger
        this.helper.save(scenarioWritePath, scenarioXML)
    }
}


export class ProgramLayer extends EventBase {
    constructor(helper, instanceOfXMLLayer) {
        super()
        this.helper = helper
        this.vmID = 0
        this.scenarioData = {}
        this.initScenario()
        this.xmlLayer = instanceOfXMLLayer
        this.funRegister = {
            scenarioDataUpdate: []
        }
    }

    initScenario = () => {
        this.vmID = 0
        this.scenarioData = {
            hv: {
                basic: {},
                advanced: {}
            },
            vm: {
                PRE_LAUNCHED_VM: [],
                SERVICE_VM: [],
                POST_LAUNCHED_VM: [],
            }
        }
    }

    onScenarioDataUpdateEvent() {
        this.funRegister.scenarioDataUpdate.map((f) => f())
    }

    newScenario = (preLaunchedVM, serviceVM, postLaunchedVM) => {
        // call by view
        this.initScenario()
        for (let i = 0; i < preLaunchedVM; i++) {
            this.addVM('PRE_LAUNCHED_VM')
        }
        for (let i = 0; i < serviceVM; i++) {
            this.addVM('SERVICE_VM')
        }
        for (let i = 0; i < postLaunchedVM; i++) {
            this.addVM('POST_LAUNCHED_VM')
        }
        this.onScenarioDataUpdateEvent()
    }


    addVM = (VMType, vmData = {}) => {
        // call by inside and view
        // if provide VMType and vmData at same time
        // function will set VMType to vmData
        let vm = vmData
        let usedVMID = false;

        // Todo: check vmData complete
        // check vmData
        if (!vm.hasOwnProperty('basic') || !vm.hasOwnProperty('advanced') || !vm.hasOwnProperty('hidden')) {
            if (!_.isEmpty(vm)) {
                console.warn('vmData is not empty but doesn\'t have correct struct')
            }
            vm = {basic: {}, advanced: {}, hidden: {}}
        }

        // check VMType
        let vmType = VMType;
        if (!_.isString(vmType) || _.isEmpty(vmType)) {
            // vmType is empty or not correct
            if (vm.hidden.hasOwnProperty('load_order')) {
                vmType = vm.hidden.load_order;
            } else {
                ThrowError('No VMType Set')
            }
        } else {
            if (vm.hidden.hasOwnProperty('load_order') && vm.hidden.load_order !== vmType) {
                console.warn("vmType and vmData provide load_order at same time, set vmData's load_order to vmType now")
            }
            vm.hidden.load_order = vmType
        }


        // check and validate vm name
        if (!vm.basic.hasOwnProperty('name') || !_.isString(vm.basic.name) || _.isEmpty(vm.basic.name)) {
            vm.basic.name = 'VM' + this.vmID
            usedVMID = true
        }

        // Check @id
        if (!vm.hasOwnProperty('@id')) {
            vm['@id'] = this.vmID
            usedVMID = true
        }

        // check VMID be used
        if (usedVMID) {
            this.vmID++
        }

        // add to config
        this.scenarioData.vm[vmType].push(vm)
        this.onScenarioDataUpdateEvent()
    }

    deleteVM = (vmID) => {
        // call by view
        for (let vmType in this.scenarioData.vm) {
            this.scenarioData.vm[vmType].map((vmConfig, vmIndex) => {
                if (vmConfig['@id'] === vmID) {
                    this.scenarioData.vm[vmType].splice(vmIndex, 1)
                }
            })
        }
        this.onScenarioDataUpdateEvent()
    }

    loadBoard = async (WorkingFolder, boardXMLPath) => {
        // call by view
        let boardData = await this.xmlLayer.loadBoard(boardXMLPath)
        if (boardData === false) {
            return false
        }
        let {boardXMLText, PCIDevices} = boardData

        // get new board file name
        let newBoardFileName = await path.basename(boardXMLPath)
        let cut = 0
        if (_.endsWith(newBoardFileName.toLowerCase(), '.xml')) {
            cut = '.xml'.length
        }
        if (_.endsWith(newBoardFileName.toLowerCase(), '.board.xml')) {
            cut = '.board.xml'.length
        }
        newBoardFileName = newBoardFileName.slice(0, newBoardFileName.length - cut)
        newBoardFileName = newBoardFileName + '.board.xml'

        // new board file save path
        const boardFileWritePath = await path.join(await this.helper.resolveHome(WorkingFolder), newBoardFileName)

        // remove current working folder old Board File first
        await this.removeOldBoardFile(WorkingFolder)

        // save board file to working director
        this.xmlLayer.saveBoard(boardFileWritePath, boardXMLText)
        // get shownName
        let shownName = await path.join(WorkingFolder, newBoardFileName)
        console.log({shownName, boardXMLText, PCIDevices})
        return {shownName, boardXMLText, PCIDevices}
    }

    loadScenario = async (scenarioXMLPath) => {
        // call by view
        let scenarioConfig = await this.xmlLayer.loadScenario(scenarioXMLPath)
        this.initScenario()
        this.scenarioData.hv = scenarioConfig.hv;
        scenarioConfig.vm.map((vmConfig) => {
            let vmType = vmConfig.hidden.load_order
            if (!this.scenarioData.vm.hasOwnProperty(vmType)) {
                ThrowError('VMType ' + vmType + ' Does Not Exist')
            }
            this.addVM(vmType, vmConfig)
        })
        this.onScenarioDataUpdateEvent()
    }

    getOriginScenarioData = () => {
        // call by inside
        let originScenario = _.cloneDeep(this.scenarioData)
        originScenario.vm = originScenario.vm.PRE_LAUNCHED_VM.concat(
            originScenario.vm.SERVICE_VM,
            originScenario.vm.POST_LAUNCHED_VM
        )
        return originScenario
    }

    async removeOldBoardFile(WorkingFolder) {
        let files = await this.helper.list(await this.helper.resolveHome(WorkingFolder))
        files.map((filename) => {
            if (_.endsWith(filename, '.board.xml')) {
                this.helper.remove(filename)
            }
        })
    }


    saveScenario = async (WorkingFolder) => {
        // call by view
        let originScenarioData = this.getOriginScenarioData()
        let filename = 'scenario.xml'
        let scenarioWritePath = await path.join(await this.helper.resolveHome(WorkingFolder), filename)
        this.xmlLayer.saveScenario(scenarioWritePath, originScenarioData)
        // noinspection UnnecessaryLocalVariableJS
        let shownPath = await path.join(WorkingFolder, filename)
        return shownPath
    }

}

export class Configurator extends EventBase {
    // get data from Program
    // convert it to view data
    constructor(helper) {
        super()

        this.WorkingFolder = this.#getURLParam('WorkingFolder')

        this.helper = helper
        this.XMLLayer = new XMLLayer(this.helper)
        this.programLayer = new ProgramLayer(this.helper, this.XMLLayer)

        this.vmSchemas = this.Schemas()
        this.hvSchema = this.vmSchemas.HV
        delete this.vmSchemas.HV

        this.updateSchema()
    }

    #getURLParam(key) {
        let hash = location.hash
        let params = hash.substring(hash.indexOf('?'))
        params = queryString.parse(params)
        return params[key]
    }

    #buildPageParams(url, queryParams = {}) {
        let data = {pathname: url}
        if (queryParams) {
            data.search = createSearchParams(queryParams).toString()
        }
        return data;
    }

    settingWorkingFolder = (WorkingFolder) => {
        this.WorkingFolder = WorkingFolder
        return this.#buildPageParams('./config', {WorkingFolder})
    }

    updateSchema = () => {
        let listingFunctions = [this.ivshmemEnum]
        listingFunctions.forEach((func) => {
            func()
            this.programLayer.register("scenarioDataUpdate", func)
        })
    }

    ivshmemEnum = () => {
        let odata = this.programLayer.getOriginScenarioData()
        let vmNames = odata.vm.map((vmData) => {
            return vmData.basic.name
        })
        if (vmNames.length === 0) {
            vmNames = ['']
        }
        this.hvSchema.basic.definitions.VMNameType.enum = vmNames
    }


    loadBoard = async (boardXMLPath, callback) => {
        let boardData = await this.programLayer.loadBoard(this.WorkingFolder, boardXMLPath)
        if (boardData === false) {
            await this.removeHistory('board', boardXMLPath)
            return
        }
        let {shownName, boardXMLText, PCIDevices} = boardData
        scenario.definitions.PCIDevsConfiguration.properties.pci_dev.items.enum = PCIDevices
        Object.keys(this.vmSchemas).map((VMTypeKey) => {
            Object.keys(this.vmSchemas[VMTypeKey]).map((configLevelKey) => {
                this.vmSchemas[VMTypeKey][configLevelKey].definitions.PCIDevsConfiguration.properties.pci_dev.items.enum = PCIDevices
            })
        })
        callback(shownName, boardXMLText)
    }

    async getHistory(key) {
        let history = await this.helper.getConfig(key + 'History', [])
        console.log(key, history)
        return history
    }

    async addHistory(key, historyPath) {
        let history = await this.getHistory(key);
        history.unshift(historyPath)
        history = _.uniq(history)
        console.log(historyPath, history)
        return this.setHistory(key, history)
    }

    async setHistory(key, history) {
        return await this.helper.setConfig(key + 'History', history)
    }

    async removeHistory(key, historyPath) {
        let history = await this.getHistory(key)
        let index = history.indexOf(historyPath);
        if (index > -1) {
            history.splice(index, 1);
        }
        return this.setHistory(key, history)
    }


    saveScenario = () => {
        let shownPath = this.programLayer.saveScenario(this.WorkingFolder)
        return this.addHistory('scenario', shownPath)
    }


    static #getSchema(prefix) {
        let basic = _.cloneDeep(scenario);
        let advanced = _.cloneDeep(scenario);

        basic.required = ["basic"]
        advanced.required = ["advanced"]

        basic.properties = {
            basic: {
                title: '',
                "$ref": "#/definitions/" + prefix + "BasicConfigType"
            }
        }
        advanced.properties = {
            advanced: {
                title: '',
                "$ref": "#/definitions/" + prefix + "AdvancedConfigType"
            }
        }
        return {basic, advanced}
    }

    Schemas() {
        let prefixData = {
            HV: 'HV',
            PRE_LAUNCHED_VM: 'PreLaunchedVM',
            SERVICE_VM: 'ServiceVM',
            POST_LAUNCHED_VM: 'PostLaunchedVM'
        }
        for (let key in prefixData) {
            prefixData[key] = Configurator.#getSchema(prefixData[key])
        }
        return prefixData
    }

    log() {
        this.helper.log(...arguments)
    }
}
