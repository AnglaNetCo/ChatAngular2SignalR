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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
const Subject_1 = require("rxjs/Subject");
/**
 * When SignalR runs it will add functions to the global $ variable
 * that you use to create connections to the hub. However, in this
 * class we won't want to depend on any global variables, so this
 * class provides an abstraction way from using $ directly in here.
 *
 * Когда SignalR начинает работу, то он добавляет все функции в глобальную
 * библиотеку (это происходит из кода js который написали в Microsoft),
 * их мы используем чтобы создать связи с хабом. Однако, в данном туториале
 * мы не хотим зависеть от любых глобальных перменных (это ужасно и с точки
 * хрения программирования), поэтому в данном туториале мы предоставим
 * абстрактные способы использования $ напрямую из данного сервиса.
 */
class SignalrWindow extends Window {
}
exports.SignalrWindow = SignalrWindow;
var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["Connecting"] = 1] = "Connecting";
    ConnectionState[ConnectionState["Connected"] = 2] = "Connected";
    ConnectionState[ConnectionState["Reconnecting"] = 3] = "Reconnecting";
    ConnectionState[ConnectionState["Disconnected"] = 4] = "Disconnected";
})(ConnectionState = exports.ConnectionState || (exports.ConnectionState = {}));
class ChannelConfig {
}
exports.ChannelConfig = ChannelConfig;
class ChannelEvent {
    constructor() {
        this.Timestamp = new Date();
    }
}
exports.ChannelEvent = ChannelEvent;
class ChannelSubject {
}
/**
 * ChannelService is a wrapper around the functionelity what SignalR
 * provides to expose the ideas of channels and events. With this service
 * you can subscribe to specific channels (or groups in signalr speak) and
 * use observables to react to specific events sent out on those channels.
 *
 * ChannelService  - это оболочка вокруг функциональности которую предоставляет
 * SignalR. Оболочка нужна для реализации идеи о каналах и событиях. С этим сервисом
 * ты можешь подписаться на уникальные потоки(каналы) (или группы в signalr чате) и
 * использовать observables чтобы реагировать на уникальные события посылаемые
 * в эти каналы (потоки).
 */
let ChannelService = class ChannelService {
    constructor(window, channelConfig) {
        this.window = window;
        this.channelConfig = channelConfig;
        // These are used to feed the public observables
        //
        // Следующие переменные используются чтобы инициализировать публичные 
        // наблюдаемые переменные, которые были упомянуты выше 
        //
        this.connectionStateSubject = new Subject_1.Subject();
        this.startingSubject = new Subject_1.Subject();
        this.errorSubject = new Subject_1.Subject();
        // An internal array to track what channel subscriptions exist
        //
        // Внутренний массив для отслеживания на какие каналы существуют подписки
        //
        this.subjects = new Array();
        if (this.window.$ === undefined || this.window.$.hubConnection === undefined) {
            throw new Error("The variable '$' or the .hubConnection() function are not defined... please check the SignalR scripts have been loaded properly"
                + "\n" +
                "Переменная '$' или .hubConnection() функция неопределены... пожалуйста, проверьте SignalR скрипты, чтобы они были загружены правильно");
        }
        // Set up our observables
        //
        // Инициализируем наши наблюдаемые объекты
        //
        this.connectionState$ = this.connectionStateSubject.asObservable();
        this.error$ = this.errorSubject.asObservable();
        this.starting$ = this.startingSubject.asObservable();
        this.hubConnection = this.window.$.hubConnection();
        this.hubConnection.url = channelConfig.url;
        this.hubProxy = this.hubConnection.createHubProxy(channelConfig.hubName);
        // Define handlers for the connection state events
        //
        // Определим обработчик для статичных событий
        //
        this.hubConnection.stateChanged((state) => {
            let newState = ConnectionState.Connecting;
            switch (state.newState) {
                case this.window.$.signalR.connectionState.connecting:
                    newState = ConnectionState.Connecting;
                    break;
                case this.window.$.signalR.connectionState.connected:
                    newState = ConnectionState.Connected;
                    break;
                case this.window.$.signalR.connectionState.reconnecting:
                    newState = ConnectionState.Reconnecting;
                    break;
                case this.window.$.signalR.connectionState.disconnected:
                    newState = ConnectionState.Disconnected;
                    break;
            }
            // Push the new state on our subject
            //
            // Положим новое состояние в наш объект
            //
            this.connectionStateSubject.next(newState);
        });
        // Define handlers for any errorSubject
        //
        // Определяем обработчики для любых ошибок
        //
        this.hubConnection.error((error) => {
            // Push the error on our subject
            //
            // Положим ошибку в наш объект
            //
            this.errorSubject.next(error);
        });
        this.hubProxy.on("onEvent", (channel, ev) => {
            console.log(`onEvent = ${channel} channel`, ev);
            // This method acts like a broker for incoming messages. We
            // check the internal array of subjects to see if one exists
            // for the channel this came in on, and then emit the event
            // on it. Otherwise we ignore the message.
            //
            // Этот метод действует как посредник для приходящих сообщений.
            // Мы проверяем внутренний массив объектов чтобы узнать существует
            // ли уже канал, в который необходимо отправить сообщение,
            // и затем отправляем (излучаем) событие в него. В противном 
            // случае мы игнорируем сообщение.
            let channelSub = this.subjects.find((x) => {
                return x.channel === channel;
            });
            // If we found a subject then e,it the event on it
            //
            // Если мы найдем такой канал(объект) в нешем массиве, то мы 
            // излучим событие 
            //
            if (channelSub !== undefined) {
                return channelSub.subject.next(ev);
            }
        });
    }
    /**
     * Start the SignalR connection. The starting$ stream willl emit an
     * event if the connection is established, otherwise it will emit an
     * error.
     *
     * Запуск SignalR соединениния. starting$ поток отправляем (излучаем)
     * событие, если соединение установится, в противном случае он
     * отправляем (излучаем) ошибку.
     */
    start() {
        // Now we only want the connection started once, so we have a special
        // starting$ obserable that clients can subscribe to know if the
        // startup sequence is done.
        //
        // If we just mapped the start() promise to an observable, then any time 
        // a client subscribed to it the start sequence would be triggered 
        // again since it's a cold observable.
        //
        // Теперь мы только хотим, чтобы единожды произошло соединение, для этого
        // у нас есть специальный starting$ наблюдаемый объект, на который клиенты
        // могут подписываться, чтобы узнать, завершилась ли последовательность 
        // действий для установления соединения.
        //
        // Если бы мы просто сопоставили start() обещание с наблюдаемым объектом, 
        // то в любой бы момент, когда клиент подпишется на него, стартовая
        // последовательность запустится снова, так как это холодный наблюдаемый 
        // объект.
        this.hubConnection.start()
            .done(() => {
            this.startingSubject.next();
        })
            .fail((error) => {
            this.startingSubject.error(error);
        });
    }
    /**
     * Get an obserable that will contain the data associated with specific
     * channel.
     *
     * Получить наблюдаемый объект, который будет содержать данные,
     * ассоциированные с уникальным каналом (потоком).
     */
    sub(channel) {
        // Try to find an obserable that we already created for the requested 
        // channel
        //
        // Попытаемся найти наблюдаемый объект, который мы уже создали 
        // для запрашиваемого потока(канала)
        //
        let channelSub = this.subjects.find((x) => {
            return x.channel === channel;
        });
        // If we already have one for this event, then just return it
        // 
        // Если у нас уже есть наблюдаемый объект для этого события,
        // то мы просто вернем его
        //
        if (channelSub !== undefined) {
            console.log(`Found existing obserable for ${channel} channel`);
            console.log(`Найден существующий наблюдаемый объект для ${channel} канала`);
            return channelSub.subject.asObservable();
        }
        //
        // If we're here then we don't already have the observable to provide the
        // caller, so we need to call the server method to join the channel 
        // and then create an obserable that the caller can use to received
        // messages.
        //
        // Если мы здесь, то значит у нас нет наблюдаемого объекта, чтобы 
        // предоставить абоненту, поэтому нам надо вызвать серверный метод, 
        // чтобы присоединиться к каналу (потоку) и потом создать наблюдаемый 
        // объект, который нуждающийся сможет использовать для получения сообщений.
        //
        // Now we just create our internal object so we can track this subject
        // in case someone else wants it too
        //
        // Теперь мы просто создадим наш внутренний объект, с тем чтобы мы 
        // могли следить за ним в случае если кто-то другой захочет его тоже
        //
        channelSub = new ChannelSubject();
        channelSub.channel = channel;
        channelSub.subject = new Subject_1.Subject();
        this.subjects.push(channelSub);
        // Now SignalR is asynchronous, so we need to ensure the connection is
        // established before we call any server methods. So we'll sibscribe to
        // the starting$ stream since that won't emit a value until the connection 
        // is ready
        //
        // Теперь SignalR асинхронен, поэтому мы должны знать что соединение
        // установлено до того, как мы вызовем любой серверный метод. Поэтому
        // мы подпишемся на starting$ поток, так как он не будет выдавать значение
        // пока соединени не будет готово
        //
        this.starting$.subscribe(() => {
            this.hubProxy.invoke("Subscribe", channel)
                .done(() => {
                console.log(`Successfully subscribed to ${channel} channel`);
            })
                .fail((error) => {
                channelSub.subject.error(error);
            });
        }, (error) => {
            channelSub.subject.error(error);
        });
        return channelSub.subject.asObservable();
    }
    // Not quite sure how to handle this (if at all) since there could be
    // more than 1 caller subscribed to an obserable we created
    //
    // Не достаточно уверен, как будет работать это, если более 1 
    // абонент будет подписываться на наблюд объект, который мы создали 
    //
    // unsubscribe(channel: string): Rx.Observable<any> {
    //     this.observables = this.observables.filter((x: ChannelObservable) => {
    //         return x.channel === channel;
    //     });
    // }
    /**
     * publish provides a way for callers to emit events on any channel. In a
     * production app the server would ensure that only authorized clients can
     * actually emit the message, but here we're not concerned about that.
     *
     * publish предоставляет абонентам способ отправить (излучить) событие в канал
     * (поток). В реальном приложении сервер гарантирует, что только аторизованные
     * клиенты могут фактически отправлять сообщения, но здесь мы не беспокоились
     * об этом.
     */
    publish(ev) {
        this.hubProxy.invoke("Publish", ev);
    }
};
ChannelService = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject(SignalrWindow)),
    __param(1, core_1.Inject("channel.config")),
    __metadata("design:paramtypes", [SignalrWindow,
        ChannelConfig])
], ChannelService);
exports.ChannelService = ChannelService;
//# sourceMappingURL=channel.service.js.map