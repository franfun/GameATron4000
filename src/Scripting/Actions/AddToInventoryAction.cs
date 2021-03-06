using System.Collections.Generic;
using System.Linq;
using GameATron4000.Models;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace GameATron4000.Scripting.Actions
{
    public class AddToInventoryAction : CommandAction
    {
        public const string Name = "AddToInventory";

        [JsonConstructor]
        private AddToInventoryAction()
        {
        }

        public AddToInventoryAction(string inventoryItemId, List<ActionPrecondition> preconditions)
            : base(preconditions)
        {
            InventoryItemId = inventoryItemId;
        }

        [JsonProperty]
        public string InventoryItemId { get; private set; }
    }
}