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
const http_1 = require("@angular/http");
const channel_service_1 = require("./services/channel.service");
class StatusEvent {
}
let TaskComponent = class TaskComponent {
    constructor(http, channelService) {
        this.http = http;
        this.channelService = channelService;
        this.messages = "";
        this.channel = "tasks";
    }
    ngOnInit() {
        // Get an observable for events emitted on this channel
        //
        // Получим наблюдаемый объект для событий отправляемых в канал(поток)
        //
        this.channelService.sub(this.channel).subscribe((x) => {
            switch (x.Name) {
                case this.eventName: {
                    this.appendStatusUpdate(x);
                }
            }
        }, (error) => {
            console.warn("Attempt to join channel failed!", error);
        });
    }
    appendStatusUpdate(ev) {
        // Just prepend this to the messages string shown in the textarea
        //
        // Просто добавим эти сообщения начала и конца данных в textarea
        //
        let date = new Date();
        switch (ev.Data.State) {
            case "starting": {
                this.messages = `${date.toLocaleTimeString()} : starting\n` + this.messages;
                break;
            }
            case "complete": {
                this.messages = `${date.toLocaleTimeString()} : complete\n` + this.messages;
            }
            default: {
                this.messages = `${date.toLocaleTimeString()} : ${ev.Data.State} : ${ev.Data.PercentComplete} % complete\n` + this.messages;
            }
        }
    }
    callApi() {
        this.http.get(this.apiUrl)
            .map((res) => res.json())
            .subscribe((message) => { console.log(message); });
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", String)
], TaskComponent.prototype, "eventName", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", String)
], TaskComponent.prototype, "apiUrl", void 0);
TaskComponent = __decorate([
    core_1.Component({
        selector: 'task',
        template: `
        <div>
            <h4>Task component bound to '{{eventName}}'</h4>
        </div>
    
        <div class="commands">
            <textarea
                class="console"
                cols="50"
                rows="15"
                disabled
                [value]="messages"></textarea>
            
            <div class="commands_input">
                <button (click)="callApi()">Call API</button>
            </div>
        </div>
    `
    }),
    __metadata("design:paramtypes", [http_1.Http,
        channel_service_1.ChannelService])
], TaskComponent);
exports.TaskComponent = TaskComponent;
//# sourceMappingURL=task.component.js.map