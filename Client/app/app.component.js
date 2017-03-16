"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
const channel_service_1 = require("./services/channel.service");
let AppComponent = class AppComponent {
    constructor(channelService) {
        this.channelService = channelService;
        // Let's wire up to the signalr observables
        //
        // Давайте подключимся к наблюдаемым объектам в signalr
        //
        this.connectionState$ = this.channelService.connectionState$
            .map((state) => { return channel_service_1.ConnectionState[state]; });
        this.channelService.error$.subscribe((error) => { console.warn(error); }, (error) => {
            console.error("error$ error", error);
            console.error("error$ ошибка", error);
        });
        // Wire up a handler for the starting$ observable to the log the
        // success/fail result
        //
        // Подключимся к обработчику starting$ наблюдаемого оюъекта, чтобы
        // вывести в лог успешный/неудачный результат
        //
        this.channelService.starting$.subscribe(() => {
            console.log("signalr service has been started");
            console.log("signalr сервис запустился");
        }, () => {
            console.warn("signalr service failed to start!");
            console.warn("signalr сервис не смог запуститься!");
        });
    }
    ngOnInit() {
        // Start the connection up!
        //
        // Зфпуск соединения!
        //
        console.log("Starting the channel service");
        console.log("Запуск сервиса каналов(потоков)");
        this.channelService.start();
    }
};
AppComponent = __decorate([
    core_1.Component({
        selector: 'my-app',
        template: `
        <div>
            <h3>SignalR w/ Angular 2 demo</h3>
        </div>
       
        <div>
            <span>Connection state: {{connectionState$ | async}}</span>
        </div>
        
        <div class="flex-row">
            <task class="flex"
                [eventName]="'longTask.status'"
                [apiUrl]="'http://localhost:9123/tasks/long'"></task>
            <task class="flex"
                [eventName]="'shortTask.status'"
                [apiUrl]="'http://localhost:9123/tasks/short'"></task>
        </div>
    `
    }),
    __metadata("design:paramtypes", [channel_service_1.ChannelService])
], AppComponent);
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map