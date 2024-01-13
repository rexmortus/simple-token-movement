import { SimpleTokenMovementForm } from './lib/forms/SimpleTokenMovementForm.js'

Handlebars.registerHelper('checklength', function (v1, v2, options) {
    if (options.fn && options.inverse) {
        return v1 > v2 ? options.fn(this) : options.inverse(this);
    }
    return v1 > v2;
});

Handlebars.registerHelper('equals', function(arg1, arg2, options) {
    if (options.fn && options.inverse) {
        return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    }
    return arg1 === arg2;
});

Handlebars.registerHelper('toUpcase', function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
});

Handlebars.registerHelper('hasEffect', function(character, effectName) {
    return character.statuses.has(effectName);
});

Handlebars.registerHelper('prependSign', function(number) {
    return number < 0 ? '-' + Math.abs(number) : '+' + number;
});

Handlebars.registerHelper('isLessThan', function(value1, value2, options) {
    if (options.fn && options.inverse) {
        return value1 < value2 ? options.fn(this) : options.inverse(this);
    }
    return value1 < value2;
});

Handlebars.registerHelper('loop', function(n, block) {
    var accum = '';
    for(var i = 0; i < n; ++i)
        accum += block.fn(i);
    return accum;
});

Handlebars.registerHelper('iterateAtIndex', function(context, index, options) {
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
    if (options.fn && options.inverse) {
        return array.includes(value) ? options.fn(this) : options.inverse(this);
    }
    return array.includes(value);
});

Handlebars.registerHelper('knowsSpell', function(spellName, ...options) {
    let knownSpell = game.user.character.itemTypes.spell.filter(spell => spell.name === spellName);
    return knownSpell.length > 0;
});

Handlebars.registerHelper('hasItem', function(itemUuid, ...options) {
    return true; // Assuming this is a placeholder for actual logic
});

// Setup the socket

let socket;

Hooks.once("socketlib.ready", () => {

    socket = socketlib.registerModule("simple-token-movement");

    socket.register("moveToken", move);
    socket.register("toggleStatus", toggleStatus)
    socket.register("tokenEmote", tokenEmote)

});

// Functions that the GM must execute via. socket

function tokenEmote(actorId, emote) {

    let token = game.canvas.tokens.get(actorId) || findByDocumentActorId(actorId);

    if (emote === 'attention') {
        emoteAttention(token)
    } else if (emote === 'joy') {
        emoteJoy(token)
    } else if (emote === 'sad') {
        emoteSad(token);
    } else if (emote === 'angry') {
        emoteAngry(token)
    } else if (emote === 'blush') {
        emoteBlush(token)
    }

}

function emoteAttention(token) {

    let counter = 0;
    const wiggleInterval = setInterval(() => {
        token.mesh.rotation = (counter % 2 === 0) ? 0.1 : -0.1;
        counter++;

        if (counter > 5) {
            clearInterval(wiggleInterval);
            token.mesh.rotation = 0; // Reset rotation
        }
    }, 100); // Adjust time for faster/slower wiggling
}

function emoteJoy(token) {

    let jumpHeight = 0;
    let originalPosition = token.mesh.y

    const jumpInterval = setInterval(() => {
        token.mesh.y += (jumpHeight % 2 === 0) ? -50 : 50; // Adjust for jump height
        jumpHeight++;

        if (jumpHeight > 5) {
            clearInterval(jumpInterval);
            token.mesh.y = originalPosition; // Reset position
        }
    }, 200); // Adjust time for faster/slower jumping
}

function emoteAngry(token) {

    token.mesh.tint = 0xFF0000; // Set tint to red
    let shakeCounter = 0;
    let originalPosition = token.mesh.x
    const shakeInterval = setInterval(() => {
        token.mesh.x += (shakeCounter % 2 === 0) ? -5 : 5; // Adjust for shake intensity
        shakeCounter++;

        if (shakeCounter > 10) {
            clearInterval(shakeInterval);
            token.mesh.x = originalPosition; // Reset position
            token.mesh.tint = 0xFFFFFF; // Reset tint (no tint)
        }
    }, 50); // Adjust time for faster/slower shaking
}


function emoteSad(token) {

    const originalScale = token.mesh.scale.x; // Assuming uniform scale for x and y
    let deflateStep = 0;

    const deflateInterval = setInterval(() => {
        token.mesh.scale.set(originalScale - 0.05 * deflateStep);
        deflateStep++;

        if (deflateStep > 5) {
            clearInterval(deflateInterval);
            token.mesh.scale.set(originalScale); // Reset scale
        }
    }, 200); // Adjust time for faster/slower deflation
}

function emoteBlush(token) {

    token.mesh.tint = 0xFFC0CB; // Set tint to light pink
    const originalScale = token.mesh.scale.x;
    token.mesh.scale.set(originalScale - 0.1); // Slightly deflate

    setTimeout(() => {
        token.mesh.scale.set(originalScale); // Reset scale
        token.mesh.tint = 0xFFFFFF; // Reset tint
    }, 1000); // Adjust time for the duration of the blush
}

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

// Setup

Hooks.once('ready', async function() {

    if (game.user.character) {

        const mainForm = new SimpleTokenMovementForm(
            socket, 
            await game.packs.get('dnd5e.items').getDocuments(),
            await game.packs.get('dnd5e.spells').getDocuments()    
        )
    
        mainForm.render(true);
    
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


        Hooks.on('updateCombat', function(...args) {
            mainForm.render(true);
        })

    } else {
        return;
    }

});
