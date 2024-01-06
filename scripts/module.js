import { SimpleTokenMovementForm } from './lib/forms/SimpleTokenMovementForm.js'

// Handlebars helpers
Handlebars.registerHelper('checklength', function (v1, v2, options) {

    if (v1>v2) {
        return options.fn(this);
    }
    return options.inverse(this);

});

Handlebars.registerHelper('equals', function(arg1, arg2, options) {

    return arg1 === arg2 ? options.fn(this) : options.inverse(this);

});

Handlebars.registerHelper('toUpcase', function(str) {

    return str.charAt(0).toUpperCase() + str.slice(1);
});

Handlebars.registerHelper('hasEffect', function(character, effectName) {

    let hasEffect = character.statuses.has(effectName);
    return hasEffect 

});

Handlebars.registerHelper('prependSign', function(number) {

    if(number < 0) {
        return '-' + Math.abs(number);
    } else {
        return '+' + number;
    }

});

Handlebars.registerHelper('isLessThan', function(value1, value2, options) {

    return value1 < value2;

});

Handlebars.registerHelper('loop', function(n, block) {

    var accum = '';
    for(var i = 0; i < n; ++i)
        accum += block.fn(i);

    return accum;

});

Handlebars.registerHelper('iterateAtIndex', function(context, index) {

    var items = context[index];
    var result = '';

    for(var i = 0; i < items.length; i++) {
        result += options.fn(items[i]);
    }

    return result;

});

Handlebars.registerHelper('isEqualToAny', function(value, ...options) {

    var possibleValues = options.slice(0, -1);
    return possibleValues.includes(value);

});

Handlebars.registerHelper('contains', function(array, value, options) {

    return array.includes(value) ? options.fn(this) : options.inverse(this);

});


Handlebars.registerHelper('knowsSpell', function(spellName, ...options) {

    let knownSpell = game.user.character.itemTypes.spell.filter(spell => spell.name === spellName)
    return knownSpell.length > 0

});

Handlebars.registerHelper('hasItem', function(itemUuid, ...options) {

    return true;
});


// 
let socket;

Hooks.once("socketlib.ready", () => {

    socket = socketlib.registerModule("simple-token-movement");
	socket.register("moveToken", move);
    socket.register("toggleStatus", toggleStatus)

});

function findByDocumentActorId(actorId) {

    let foundEntry = null;

    canvas.tokens.ownedTokens.forEach((value, key) => {
        if (value.document && value.document.actorId === actorId) {
            foundEntry = value;
        }
    });

    return foundEntry;
}

function move(actorId, move) {

    let token = findByDocumentActorId(actorId)

    let newX = token.x + token.w * move[0]
    let newY = token.y + token.h * move[1]
    
    const newPoint = canvas.grid.getSnappedPosition(newX, newY)

    if (!token.checkCollision(newPoint)) {
      token.document.update(newPoint)
    }

}

function toggleStatus(actorId, effectId) {

    let token = findByDocumentActorId(actorId)
    token.toggleEffect(CONFIG.statusEffects.find(effect => effect.id === effectId));

}   


Hooks.once('ready', async function() {

    const mainForm = new SimpleTokenMovementForm(
        socket, 
        await game.packs.get('dnd5e.items').getDocuments(),
        await game.packs.get('dnd5e.spells').getDocuments()    
    )

    mainForm.render(true);

    // Setup hooks
    Hooks.on('simple-token-movement.openForm', function() {
        mainForm.render(true);
    });

    Hooks.on('updateActor', function(actor) {
        if (actor.id === game.user.character.id) {
            mainForm.render(true);
        }
    });

    Hooks.on('updateItem', function(item) {
        if (item.parent.id === game.user.character.id) {
            mainForm.render(true);
        }
    })

    Hooks.on('createItem', function(item) {
        if (item.parent.id === game.user.character.id) {
            mainForm.render(true);
        }
    })

    Hooks.on('deleteItem', function(item) {
        if (item.parent.id === game.user.character.id) {
            mainForm.render(true);
        }
    })

    Hooks.on('createActiveEffect', function(effect) {

        if (effect.parent.id === game.user.character.id) {
            mainForm.render(true)
        }
    
    })
    
    Hooks.on('deleteActiveEffect', function(effect) {
    
        if (effect.parent.id === game.user.character.id) {
            mainForm.render(true)
        }

    })

    Hooks.on('createChatMessage', function(chatMessage, options, userId) {
        mainForm.addChatMessage(chatMessage)
        mainForm.render(true);
    })

    // Hooks.on('dnd5e.displayCard', function(item, chatMessage) {
    //     mainForm.render(true)
    //     mainForm._tabs[0].activate('chat-message-tab')
    // })

});
