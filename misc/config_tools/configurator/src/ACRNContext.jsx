import React, {createContext} from 'react'
import {ACRNConfig} from "./config";
import {Helper, TauriLocalFSBackend} from "./lib/helper";
import {Configurator} from "./lib/acrn";

// 1. 使用 createContext 创建上下文
export const ACRNContext = createContext({
    config: ACRNConfig,

    helper: () => {
    },
    configurator: () => {
    }
})

// 2. 创建 Provider
export class ACRNProvider extends React.Component {
    constructor(props) {
        super(props);
        let fsBackend = new TauriLocalFSBackend()
        let helper = new Helper(fsBackend, fsBackend)
        let configurator = new Configurator(helper)
        this.state = {
            config: ACRNConfig,
            helper: helper,
            configurator: configurator
        }
    }

    render() {
        console.log(this.state)
        return (
            <ACRNContext.Provider value={this.state}>
                {this.props.children}
            </ACRNContext.Provider>
        )
    }
}

// 3. 创建 Consumer
export const ACRNConsumer = ACRNContext.Consumer
