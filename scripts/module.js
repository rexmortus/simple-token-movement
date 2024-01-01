import { SimpleTokenMovementForm } from './lib/forms/SimpleTokenMovementForm.js'

// Handlebars helpers
Handlebars.registerHelper('checklength', function (v1, v2, options) {
    'use strict';
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

let socket;

Hooks.once("socketlib.ready", () => {
    socket = socketlib.registerModule("simple-token-movement");
	socket.register("moveToken", move);
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

function move(actorID, move) {

    let token = findByDocumentActorId(actorID)

    let newX = token.x + token.w * move[0]
    let newY = token.y + token.h * move[1]
    
    const newPoint = canvas.grid.getSnappedPosition(newX, newY)
    if (!token.checkCollision(newPoint)) {
      token.document.update(newPoint)
    }
}


Hooks.once('ready', async function() {

    const mainForm = new SimpleTokenMovementForm(socket, {tabs: [{navSelector: ".tabs", contentSelector: ".content", initial: "tab1"}] });

    mainForm.render(true);

    // Show form
    Hooks.on('simple-token-movement.openForm', function() {
        mainForm.render(true);
    });

    Hooks.on('updateActor', function() {
        mainForm.render(true);
    });

    Hooks.on('updateItem', function() {
        mainForm.render(true);
    })

    Hooks.on('createItem', function() {
        mainForm.render(true);
    })

    Hooks.on('deleteItem', function() {
        mainForm.render(true);
    })

});
