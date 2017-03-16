using Microsoft.AspNet.SignalR;
using Owin;
using Server.Hubs;
using Server.Hubs.HubPipeLineModules;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;

namespace Server
{
    class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            // This server will be accessed by clients from other domains, so
            //  we open up CORS. This needs to be before the call to
            //  .MapSignalR()!
            //
            //Теперь мы подключаем Cors чтобы ангуляр смог образаться к нашему серверу с разных доменов
            //
            app.UseCors(Microsoft.Owin.Cors.CorsOptions.AllowAll);

            // Add SignalR to the OWIN pipeline
            //
            //Добавляем использование СигналР
            //
            // Any connection ot hub wire up and configuration should go here
            GlobalHost.HubPipeline.AddModule(new ErrorHandlingPipelineModule()); // пишем в лог ошибки
            //a custom Hub pipeline module that logs each incoming method call received from the client and outgoing method call invoked on the client:
            GlobalHost.HubPipeline.AddModule(new LoggingPipelineModule()); // логирует все входязие и выходящие ответы от клиента и выходящие методы вызываемые на клиенте
            app.MapSignalR();

            // Build up the WebAPI middleware
            //
            //Создание WEbAPI
            //
            var httpConfig = new HttpConfiguration();

            httpConfig.MapHttpAttributeRoutes(); 
            //это надо чтобы мы могли делать маршрутизацию в контроллерах
            //например у нас в контроллере есть атрибуты tasks и такде у методов есть атрибуты short long

            app.UseWebApi(httpConfig);

        }
    }
}
