import { SimpleTokenMovementForm } from './lib/forms/SimpleTokenMovementForm.js'

Hooks.once('init', async function() {

});

Hooks.once('ready', async function() {

    const mainForm = new SimpleTokenMovementForm();

    mainForm.render(true);

    // Show form
    Hooks.on('simple-token-movement.openForm', function(tick) {
        mainForm.render(true);
    });

});
