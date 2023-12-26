import { SimpleTokenMovementForm } from './lib/forms/SimpleTokenMovementForm.js'

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
      canvas.animatePan({
        duration: 250,
        x: newPoint.x + token.w / 2,
        y: newPoint.y + token.h / 2,
        scale: canvas.scene._viewPosition.scale,
      })
    }
}


Hooks.once('ready', async function() {

    const mainForm = new SimpleTokenMovementForm();

    mainForm.render(true);

    // Show form
    Hooks.on('simple-token-movement.openForm', function(tick) {
        mainForm.render(true);
    });

});
