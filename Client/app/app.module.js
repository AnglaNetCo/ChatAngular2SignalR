"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
const platform_browser_1 = require("@angular/platform-browser");
const http_1 = require("@angular/http");
require("rxjs/add/operator/map");
const channel_service_1 = require("./services/channel.service");
const app_component_1 = require("./app.component");
const task_component_1 = require("./task.component");
let channelConfig = new channel_service_1.ChannelConfig();
channelConfig.url = "http://localhost:9123/signalr";
channelConfig.hubName = 'EventHub';
let AppModule = class AppModule {
};
AppModule = __decorate([
    core_1.NgModule({
        imports: [platform_browser_1.BrowserModule, http_1.HttpModule],
        declarations: [app_component_1.AppComponent, task_component_1.TaskComponent],
        providers: [
            channel_service_1.ChannelService,
            { provide: channel_service_1.SignalrWindow, useValue: window },
            { provide: 'channel.config', useValue: channelConfig }
        ],
        bootstrap: [app_component_1.AppComponent]
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map