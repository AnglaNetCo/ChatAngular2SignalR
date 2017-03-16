using Microsoft.AspNet.SignalR;
using Serilog;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;

namespace Server.Api
{
    //Этот класс позволит симулировать использования контроллера который показывает длинные и короткие процесс
    //1) Мы просто захватим ссылку SignalR на контекст из статичного свойства GlobalHost. Сделаем инъекцию 
    //2) 
    //3) PubkishEvent метод вызывает invoke(прописывали в main) который в свою очередь призывает к к 
    //импользованию контекста клиента. Это не вызывает пебличные методы в EventHub клссе.
    //преифкс который будет использоваться в маршрутах чтобы пойти по этому контроллеру. Это тема маршрутизация

    [RoutePrefix("tasks")] 
    public class TaskController : ApiController
    {
        // This can be defined a number of ways
        //
        //здесь будем хранить контекст хаба
        //
        private IHubContext _context; 

        //Может быть определено несколькими способами
        private string _channel = Constants.TaskChannel; // по умолчанию идет поток задач

        public TaskController()
        {
            //Normally we would inject this
            //
            //здесь мы будем делать инъекцию нашего контекста EventHub
            //
            _context = GlobalHost.ConnectionManager.GetHubContext<EventHub>();
        }

        [Route("long")]
        [HttpGet]
        public IHttpActionResult GetLongTask()
        {
            Log.Information("Starting long task");

            double steps = 10;
            var eventName = "longTask.status";

            ExecuteTask(eventName, steps);

            return Ok("Long task complete");
        }

        [Route("short")]
        [HttpGet]
        public IHttpActionResult GetShortTask()
        {
            Log.Information("Starting short task");

            double steps = 5;
            var eventName = "shortTask.status";

            ExecuteTask(eventName, steps);

            return Ok("Short task complete");
        }

        private void ExecuteTask(string eventName, double steps)
        {
            var status = new Status
            {
                State = "starting",
                PercentComplete = 0.0
            };

            PublishEvent(eventName, status);

            for (double i = 0; i < steps; i++)
            {
                // Update the status and publish a new event
                //
                status.State = "working";
                status.PercentComplete = (i / steps) * 100;
                PublishEvent(eventName, status);

                Thread.Sleep(500);
            }

            status.State = "complete";
            status.PercentComplete = 100;
            PublishEvent(eventName, status);
        }

        private void PublishEvent(string eventName, Status status)
        {
            // From .Net code like this we can't invoke the methods that 
            // exist on our actual Hub class... because we inly have a proxy
            // to it. So to publish the event we need to call the method that
            // the clients will be listening on.

            //Из .Net кода как этот мы не можем вызвать методы, которые 
            // существуют на нашем актуальном(существующем) Hub классе, потому что
            // у нас есть только прокси для этого. Поэтому чтобы опубликовать (распространить)
            // событие нам необходимо позвонить (вызвать) метод который клиент будут прослушивать
            // то есть метод который будет на клиенте. В нашем случае OnEvent
            _context.Clients.Group(_channel).OnEvent(Constants.TaskChannel, new ChannelEvent
            {
                ChannelName = Constants.TaskChannel,
                Name = eventName,
                Data = status
            });
        }

    }

    public class Status
    {
        public string State { get; set; }

        public double PercentComplete { get; set; }
    }
}
