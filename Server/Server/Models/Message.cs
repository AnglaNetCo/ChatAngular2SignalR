using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server.Models
{
    /// <summary>
    /// A generic object to send and receive messages in our SignalR hubs
    /// Обобщенный объект который позволяет получать и отправлять сообщения SignalR хабе
    /// Это некий контайнер для сообщений
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
