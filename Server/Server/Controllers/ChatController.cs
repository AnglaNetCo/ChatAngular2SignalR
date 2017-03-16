using Microsoft.AspNet.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;

namespace Server.Api
{
    [RoutePrefix("chat")]
    public class ChatController : ApiController
    {
        private IHubContext _context;

        private string _channel = ConstantsChat.SharedChatChannel;

        public ChatController()
        {
            _context = GlobalHost.ConnectionManager.GetHubContext<EventHub>();
        }

    }
}
