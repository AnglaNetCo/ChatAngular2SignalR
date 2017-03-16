import { Injectable, Inject } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

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
export class SignalrWindow extends Window {
    $: any;
}

export enum ConnectionState {
    Connecting = 1,
    Connected = 2,
    Reconnecting = 3,
    Disconnected = 4
}

export class ChannelConfig {
    url: string;
    hubName: string;
    channel: string;
}

export class ChannelEvent {
    Name: string;
    ChannelName: string;
    Timestamp: Date;
    Data: any;
    Json: string;

    constructor() {
        this.Timestamp = new Date();
    }
}

class ChannelSubject {
    channel: string;
    subject: Subject<ChannelEvent>;
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

@Injectable()
export class ChannelService {
    /**
     * starting$ is an observable available to know if the signalr
     * connection is ready or not. On a successful connection this 
     * stream will emit a value.
     * 
     * starting$  - это наблюдаемый (obserable лучше не переводить) объект
     * предназначенный для понимание того, соединение произошло или нет 
     * (готово ли оно или нет). Если соединение произошло успешно, то этот поток 
     * инжектирует (излучит) значение успеха.
     */
    starting$: Observable<any>;

    /**
     * connectionState$ provides the current state of the underlying
     * connection as an observable stream.
     * 
     * connectionState$ предоставляет текущее состояние основного соединения 
     * в качестве наблюдаемого потока.
     */
    connectionState$: Observable<ConnectionState>;

    /**
     * error$ provides a strem of any error messages that occur on the 
     * SignalR connection
     * 
     * error$ предоставляет поток каких-либо сообщений об ошибке,
     *  которые происходят в SignalR соединении.
     */
    error$: Observable<string>;

    // These are used to feed the public observables
    //
    // Следующие переменные используются чтобы инициализировать публичные 
    // наблюдаемые переменные, которые были упомянуты выше 
    //
    private connectionStateSubject = new Subject<ConnectionState>();
    private startingSubject = new Subject<any>();
    private errorSubject = new Subject<any>();

    // These are used to track the internal SignalR state
    //
    // Следующие переменные используются для отслеживания внутренних 
    // состояний SignalR
    //
    private hubConnection: any;
    private hubProxy: any;

    // An internal array to track what channel subscriptions exist
    //
    // Внутренний массив для отслеживания на какие каналы существуют подписки
    //
    private subjects = new Array<ChannelSubject>();

    constructor(
        @Inject(SignalrWindow) private window: SignalrWindow,
        @Inject("channel.config") private channelConfig: ChannelConfig
    ) {
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
        this.error$ = this.errorSubject.asObservable()
        this.starting$ = this.startingSubject.asObservable();

        this.hubConnection = this.window.$.hubConnection();
        this.hubConnection.url = channelConfig.url;
        this.hubProxy = this.hubConnection.createHubProxy(channelConfig.hubName);

        // Define handlers for the connection state events
        //
        // Определим обработчик для статичных событий
        //
        this.hubConnection.stateChanged((state: any) => {
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
        this.hubConnection.error((error: any) => {
            // Push the error on our subject
            //
            // Положим ошибку в наш объект
            //
            this.errorSubject.next(error);
        });

        this.hubProxy.on("onEvent", (channel: string, ev: ChannelEvent) => {
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
            let channelSub = this.subjects.find((x: ChannelSubject) => {
                return x.channel === channel;
            }) as ChannelSubject;

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
    start(): void {
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
            .fail((error: any) => {
                this.startingSubject.error(error);
            })
    }

    /**
     * Get an obserable that will contain the data associated with specific 
     * channel.
     * 
     * Получить наблюдаемый объект, который будет содержать данные, 
     * ассоциированные с уникальным каналом (потоком).
     */
    sub(channel: string): Observable<ChannelEvent> {

        // Try to find an obserable that we already created for the requested 
        // channel
        //
        // Попытаемся найти наблюдаемый объект, который мы уже создали 
        // для запрашиваемого потока(канала)
        //
        let channelSub = this.subjects.find((x: ChannelSubject) => {
            return x.channel === channel;
        }) as ChannelSubject;

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
        channelSub.subject = new Subject<ChannelEvent>();
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
                .fail((error: any) => {
                    channelSub.subject.error(error);
                });
        },
            (error: any) => {
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
    publish(ev: ChannelEvent): void {
        this.hubProxy.invoke("Publish", ev);
    }


}