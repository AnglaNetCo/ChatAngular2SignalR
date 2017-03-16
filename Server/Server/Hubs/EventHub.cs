using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server.Api
{
    /// <summary>
    /// A SignalR hub the provides channel-based event broadcasting 
    /// that clietnts can subscribe to
    /// SignalR хаб (пер. концентратор) который обеспечивает 
    /// распростарнение(вещание) базоваого потока собтия на который пользователи (клиенты) подписались
    /// </summary>
    public class EventHub : Hub
    {

        //Ключевое слово async указывает, что метод или лямбда-выражение являются асинхронными. 
        //
        // //Данный класс описывает отдельную задачу, которая запускается в отдельном потоке
        /// <summary>
        /// Выполняет подписку подключившегося клиента. То есть добавляет его в определенную вещательную группу
        /// </summary>
        /// <param name="channel">Name of channel. Имя группы к которой будет принадлежать подключившийся клиет </param>

        public async Task Subscribe(string channel)
        {
            //await применяется к задаче в асинхронных методах, чтобы приостановить в
            //ыполнение метода до тех пор, пока эта задача 
            //не завершится. При этом выполнение потока, в котором 
            //был вызван асинхронный метод, не прерывается.

            await Groups.Add(Context.ConnectionId, channel);

            var ev = new ChannelEvent
            {
                ChannelName = Constants.AdminChannel,
                Name = "user.subscribed",
                Data = new
                {
                    Context.ConnectionId,
                    ChannelName = channel
                }
            };

            await Publish(ev);
        }


        /// <summary>
        /// Отписывает клиента от какой-то группы
        /// </summary>
        /// <param name="channel">Имя группы от которого надо отписаться</param>
        public async Task Unsubscribe(string channel)
        {
            //Удаляет подключение из определенной групы
            await Groups.Remove(Context.ConnectionId, channel);

            var ev = new ChannelEvent
            {
                ChannelName = Constants.AdminChannel,
                Name = "user.unsubscribed",
                Data = new
                {
                    Context.ConnectionId,
                    ChannelName = channel
                }
            };

            await Publish(ev);
        }

        /// <summary>
        /// Публикует (отправляет) на клиент событие. При этом отправляет в оперделенную группу, если эта группа не администратора, 
        /// то ему тоже группе администратора тоже отправляется это событие
        /// </summary>
        /// <param name="channelEvent"></param>
        /// <returns>Создает результат который говорит что всё завершилось удачно</returns>
        public Task Publish(ChannelEvent channelEvent)
        {
            Clients.Group(channelEvent.ChannelName).OnEvent(channelEvent.ChannelName, channelEvent);

            if (channelEvent.ChannelName != Constants.AdminChannel)
            {
                //Push this out on the admin channel
                //Если событие пришло не из группы админа, то мы публикуем помимо основной группы и в группу админа тоже
                Clients.Group(Constants.AdminChannel).OnEvent(Constants.AdminChannel, channelEvent);
            }

            //ВОЗВРАЩАЕТ РЕЗУЛЬТАТ С НАДПИСЬЮ ТОГО, ЧТО ВСЁ ЗАВЕРШИЛОСЬ УДАЧНО
            return Task.FromResult(0);
        }


        /// <summary>
        /// Переодпределяем функцию соединения. 
        /// Она вызывается когда происходит соединение с экземпляром хаба
        /// </summary>
        /// <returns></returns>
        public override Task OnConnected()
        {
            var ev = new ChannelEvent
            {
                ChannelName = Constants.AdminChannel,
                Name = "user.connected",
                Data = new
                {
                    Context.ConnectionId,
                }
            };

            Publish(ev);

            return base.OnConnected();
        }


        /// <summary>
        /// Переопределили разъединение и отправили это на клиент
        /// </summary>
        /// <param name="stopCalled"></param>
        public override Task OnDisconnected(bool stopCalled)
        {
            var ev = new ChannelEvent
            {
                ChannelName = Constants.AdminChannel,
                Name = "user.disconnected",
                Data = new
                {
                    Context.ConnectionId,
                }
            };

            Publish(ev);

            return base.OnDisconnected(stopCalled);
        }

    }

    /// <summary>
    /// A generic object to reperesent a broadcasted event in our SignalR hubs
    /// Обобщенный объект который позволяет распространить событие в нашем СигналР хабе
    /// Это некий контайнер для любых событий которые будут опубдикованы
    /// </summary>
    public class ChannelEvent
    {
        /// <summary>
        /// The name of the event
        /// Имя события, например, "Подключение юзера"
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// The name of the channel the event is associated with
        /// Имя потока(канала) с которым ассоциировано событие
        /// </summary>
        public string ChannelName { get; set; }

        /// <summary>
        /// The date/time that the event was created
        /// Дата/Время когда было создано событие
        /// </summary>
        public DateTimeOffset Timestamp { get; set; }


        /// <summary>
        /// The data associated woth the event
        /// Ассоциироанные с событием данные. Они могут быть любые
        /// </summary>
        public object Data
        {
            get { return _data; }
            set
            {
                _data = value;
                this.Json = JsonConvert.SerializeObject(_data);
                //атоматические заполняем свойство JSON - сериализованные данные
            }
        }
        private object _data;

        /// <summary>
        /// A JSON representation of the event data. This is set 
        /// automatically when the Data property is assigned.
        /// JSON предсталвение данных события. Это устанавливается 
        /// автоматически когда заполняется свойство "Данные"
        /// </summary>
        public string Json { get; private set; }

        public ChannelEvent()
        {
            Timestamp = DateTimeOffset.Now;
        }
    }
}
