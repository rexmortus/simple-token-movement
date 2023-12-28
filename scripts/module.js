import { SimpleTokenMovementForm } from './lib/forms/SimpleTokenMovementForm.js'

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
    Hooks.on('simple-token-movement.openForm', function(tick) {
        mainForm.render(true);
    });

});
