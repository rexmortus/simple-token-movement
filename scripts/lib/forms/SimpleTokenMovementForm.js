export class SimpleTokenMovementForm extends FormApplication {
  
  constructor(socket, itemCompendium, spellCompendium) {
    
    super();
    
    // stuff
    this.socket = socket

    // Preload compendiums
    this.itemCompendium = itemCompendium
    this.spellCompendium = spellCompendium
    this.equipmentCompendium = this.itemCompendium.filter(item => ['equipment', 'weapon'].includes(item.type)).sort((a, b) => a.name.localeCompare(b.name))

    // Relating to touches
    this.startElement
    this.touchStartX
    this.touchStartY 
    this.cancelLongPress
    this.longPressTimer

    // Some Configuration stuff
    this.characterTabOrder = ['race', 'class', 'background', 'feat']
    this.actionKeys = Object.keys(game.modules.get('character-actions-list-5e').api.getActorActionsData(game.user.character))
    
    // Relating to spell compendium UI filters
    this.spellCompendiumFilters = ['all-levels']

    // Chat messages
    this.chatMessages = []

  }

  static get defaultOptions() {

    return mergeObject(super.defaultOptions, {
        classes: ["form"],
        popOut: true,
        template: "modules/simple-token-movement/scripts/lib/forms/SimpleTokenMovementForm.html",
        id: "simple-token-movement",
        title: game.user.character.name + " | " + game.user.character.itemTypes.class[0].name + " " + game.user.character.itemTypes.class[0].system.levels,
        height: 800,
        width: 400,
        minimizable: false,
        classes: ["simple-token-movement"],
        tabs: [
          {
            group: 'page-controller',
            navSelector: ".page-controller",
            contentSelector: '.page-content',
            initial: 'controller-tab'
          },
          {
            group: 'token-controller',
            navSelector: ".token-controller-tabs", 
            contentSelector: ".token-controller-content", 
            initial: "actions-tab" 
          },
        ],
    });
  }

  move(x, y) {
    this.socket.executeAsGM('moveToken', game.user.character.id, [x,y])
  }

  moveTopLeft() {
    this.move(-1, -1)
  }

  moveLeft() {
    this.move(-1, 0)
  }

  moveBottomLeft() {
    this.move(-1, 1)
  }

  moveTop() {
    this.move(0, -1)
  }

  moveBottom() {
    this.move(0, 1)
  }

  moveTopRight() {
    this.move(1, -1)
  }

  moveRight() {
    this.move(1, 0)
  }

  moveBottomRight() {
    this.move(1, 1)
  }

  onTouchStart(event) {

    // If the player is tapping a button within the token-controller-action, then return and
    // let the button-specific handler do its thing
    let isButton = $(event.target).is(':button')
    if (isButton) {
      return;
    }

    // Otherwise, store the element where touchstart occurred
    this.startElement = event.currentTarget;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.cancelLongPress = false;

    $(this.startElement).addClass('tapped');
    this.longPressTimer = setTimeout(this.onLongPress.bind(this, event),500);

  }

  onTouchMove(event) {
    
    // Determine if the touch has moved significantly
    if (Math.abs(event.touches[0].clientX - this.touchStartX) > 10 || 
        Math.abs(event.touches[0].clientY - this.touchStartY) > 10) {
        this.cancelLongPress = true;
        $(this.startElement).removeClass('tapped');
        clearTimeout(this.longPressTimer);
    }
  } 

  onLongPress(event) {

    this.cancelLongPress = true;
    
    let eventType = $(this.startElement).data('eventType');

    if (['action', 'spell', 'inventory', 'character'].includes(eventType)) {
      
      let itemId = $(this.startElement).data('itemId');
      let item = game.user.character.items.filter(item => item.id === itemId)[0]
      let isExpanded = item.getFlag('simple-token-movement', 'expanded');
      
      if (isExpanded) {

        item.setFlag('simple-token-movement', 'expanded', false);

      } else {

        item.setFlag('simple-token-movement', 'expanded', true);

      }

    } 
    
    else if(['manage-inventory', 'manage-spell'].includes(eventType)) {

      let itemId = $(this.startElement).data('itemId');
      let item = this.spellCompendium.filter(item => item._id === itemId)[0]
      item.sheet.render(true);
      
    }
    
  }

  onTouchEnd(event) {

    // Get the event type (ability, skill, action)
    let eventType = $(this.startElement).data('eventType');
    let isButton = $(event.target).is(':button')

    // Only trigger if the touchEnd target is the same as the touchStart element
    // That the long press hasn't been cancelled
    // And that it's not a button (inside the main element, use individual handlers for that)
    if (event.currentTarget === this.startElement && !this.cancelLongPress && !isButton) { 

      // Clear out old chat messages
      this.chatMessages = []

      // Abilities
      if (eventType === 'ability') {

        let ability = $(this.startElement).data('ability')
        game.user.character.rollAbility(ability)
        this._tabs[0].activate('chat-message-tab')

      }

      // Skills
      if (eventType === 'skill') {
       
        let skill = $(this.startElement).data('skill')
        game.user.character.rollSkill(skill)
        this._tabs[0].activate('chat-message-tab')

      }

      // Actions/spells/inventory
      if (['action', 'spell', 'inventory', 'character'].includes(eventType)) {
        
        let itemId = $(this.startElement).data('itemId');
        let item = game.user.character.items.filter(item => item.id === itemId)[0]
        item.use();
        this._tabs[0].activate('chat-message-tab');

      }

      // Condition
      if(eventType === 'condition') {

        let effectId = $(this.startElement).data('condition');
        this.socket.executeAsGM('toggleStatus', game.user.character.id, effectId);
        
      }

    }
  
    // Untap the timer
    $(this.startElement).removeClass('tapped');

    // Reset the startElement for the next touch
    this.startElement = null;

    // Clear the long-touch interval timer
    clearTimeout(this.longPressTimer);

  }

  toPluralCamelCase(word) {

    if (!word) return '';

    // Capitalize the first letter and add 's' for plural
    return word.charAt(0).toUpperCase() + word.slice(1);

  }

  // Create a Spell List, ordered by level
  spellsByLevel() {

    let spellsByLevel = {};

    game.user.character.itemTypes.spell.forEach(spell => {
        let level = spell.system.level;
        if (!spellsByLevel[level]) {
            spellsByLevel[level] = [];
        }
        spellsByLevel[level].push(spell);
    });

    Object.keys(spellsByLevel).forEach(spellLevel => {
      this.sortItemsByName(spellsByLevel[spellLevel])
    })

    return spellsByLevel;

  }

  // Create a compendium Spell List, ordered by level

  // Create a Spell List, ordered by level
  filteredSpellCompendiumByLevel() {

    let spellsByLevel = {};

    // Prepare all spell compendium entries, grouped by spell level 
    this.spellCompendium.forEach(spell => {

        let level = spell.system.level;

        if (!spellsByLevel[level]) {
            spellsByLevel[level] = [];
        }

        if (this.spellCompendiumFilters.includes('known')) {
          
          if (game.user.character.items.getName(spell.name)) {

            spellsByLevel[level].push(spell);

          }

        } else {

          spellsByLevel[level].push(spell);

        }

    });

    // Sort the spells within each spell level group alphabetically
    Object.keys(spellsByLevel).forEach(spellLevel => {

      this.sortItemsByName(spellsByLevel[spellLevel])

    })

    // Filter by spell level
    if (this.spellCompendiumFilters.includes('all-levels')) {

      return spellsByLevel;

    } else {

      let filteredSpells = {};

      this.spellCompendiumFilters.forEach(spellLevel => {
          if (spellsByLevel.hasOwnProperty(spellLevel)) {
            filteredSpells[spellLevel] = spellsByLevel[spellLevel];
          }
      });

      return filteredSpells;

    }

    // return spellsByLevel;

  }

  sortItemsByName(items) {
    return items.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Create an inventory list, ordered by level
  itemsByType() {

    let itemsByType = {};

    game.user.character.items.filter(item => !['spell', 'feat', 'class', 'subclass', 'race', 'background'].includes(item.type)).forEach(item => {
        let itemType = this.toPluralCamelCase(item.type);
        if (!itemsByType[itemType]) {
            itemsByType[itemType] = [];
        }
        itemsByType[itemType].push(item);
    });

    Object.keys(itemsByType).forEach(itemType => {
      this.sortItemsByName(itemsByType[itemType])
    })

    return itemsByType;

  }

  // Create a list of character features, ordered by type
  featuresByType() {

    let featuresByType = {};

    game.user.character.items.filter(item => ['race','class', 'subclass', 'background','feat'].includes(item.type)).forEach(item => {

      let itemType = this.toPluralCamelCase(item.type);

      if (!featuresByType[itemType]) {
          featuresByType[itemType] = [];
      }
      
      featuresByType[itemType].push(item);
    });

    Object.keys(featuresByType).forEach(featureType => {
      this.sortItemsByName(featuresByType[featureType])
    })

    return featuresByType;

  }

  maxSpellsPrepared() {

    return game.user.character.system.abilities.int.mod + game.user.character.system.details.level

  }

  numOfSpellsPrepared() {

    let numOfSpellsPrepared = 0;

    game.user.character.items.filter(item => item.type === 'spell').forEach(spell => {
      
      if (spell.system.preparation.prepared) {
        numOfSpellsPrepared += 1;
      }

    });

    return numOfSpellsPrepared;
  }

  spellSlots() {

    let filteredSpellsArray = Object.keys(game.user.character.system.spells)
        .filter(key => key !== 'pact').sort()
        .map(key => game.user.character.system.spells[key]);
    
    return filteredSpellsArray;

  }

  numberOfSpellsKnown(cantrips=false) {

    if (cantrips) {
      return game.user.character.itemTypes.spell.filter(spell => spell.system.level === 0 && spell.system.preparation.mode != 'innate').length
    } else {
      return game.user.character.itemTypes.spell.filter(spell => spell.system.level != 0).length
    }
    
  }

  showConditionsManagement() {

    this._tabs[0].activate('conditions-tab');

  }

  closeConditionManagement() {

    this._tabs[0].activate('controller-tab');

  }

  showRestDialog() {

    let dialog = new Dialog({
      title: "Rest",
      content: "",
      buttons: {
       one: {
        icon: '<i class="fas fa-clock"></i>',
        label: "Short Rest",
        callback: () => game.user.character.shortRest()
       },
       two: {
        icon: '<i class="fas fa-bed"></i>',
        label: "Long Rest",
        callback: () => game.user.character.longRest()
       }
      },
      default: "one",
     });
     dialog.render(true);

  }

  showHPManagement() {

    this._tabs[0].activate('hp-tab');
  }

  closeHPManagement() {

    this._tabs[0].activate('controller-tab');

  }

  incrementHPControllerValue(event) {
    
    let input = $(event.currentTarget);
    let increment = input.data('increment');
    let updateButton = $('[data-damage-button="update"]');
    let currentValue = $('[data-hp-controller-value]').val();
    let hp = game.user.character.system.attributes.hp;
    let currentHP = hp.value;
    let maxHP = hp.max;
    let currentTempHP = hp.temp;
    let tempHPMax = hp.tempmax;
    

    if (increment === 'death') {

      return game.user.character.applyDamage(hp.value);
    
    } 
    
    else if (increment === 'heal') {

      return game.user.character.applyDamage(-(hp.max - hp.value));
    
    }

    else {

      // If there is no current value, set it to 0
      if (currentValue === '') {

        $('[data-hp-controller-value]').val(0);

      }
      
      let incrementorInput = $('[data-hp-controller-value]').val( function(i, oldval) {

        return parseInt( oldval, 10) + increment;
     
      });
  
      let incrementorValue = parseInt(incrementorInput.val());
      let currentHPDisplay = $('[data-current-hp]');
      let currentTempHPDisplay = $('[data-current-temp-hp]')
  
      // Reset display to current values
      if (incrementorValue === 0) {
  
        updateButton
          .removeClass('heal-button damage-button')
          .prop('disabled', true)
          .text('No Action');

        currentHPDisplay
            .removeClass('heal-display damage-display')
            .text(currentHP);

        currentTempHPDisplay.text(currentTempHP);
  
      } 
      
      // If they are trying to heal
      else if (incrementorValue > 0 ) {
         
        if (currentHP + incrementorValue <= maxHP) {
          
          updateButton
            .addClass('heal-button')
            .removeClass('damage-button')
            .prop('disabled', false)
            .text('Heal')
          
          // If they have temp HP > 0, but are wounded
          if (currentTempHP >= 0 && currentHP < maxHP) {

            currentHPDisplay
              .addClass('heal-display')
              .removeClass('damage-display')
              .text(currentHP + Math.abs(incrementorValue)) 
          
            // If they have no temp HP, but are wounded
          } else if (currentTempHP === 0 && currentHP < maxHP) {
  
            currentHPDisplay
              .addClass('heal-display')
              .removeClass('damage-display')
              .text(currentHP + incrementorValue)

          } else {

            currentHPDisplay.text(currentHP);

          }

        } else {

          return incrementorInput.val(incrementorValue - 1);
          
        }
  
      } else if (incrementorValue < 0) {
  
        updateButton.addClass('damage-button').removeClass('heal-button');
        updateButton.prop('disabled', false);
        updateButton.text('Damage');
  
        if (currentTempHP > 0 && currentTempHP >= Math.abs(incrementorValue)) {
          currentHPDisplay
            .removeClass('damage-display')
            .text(currentHP);
          currentTempHPDisplay.text(currentTempHP + incrementorValue)
  
        } else {
  
          currentHPDisplay.removeClass('heal-display').addClass('damage-display');
          currentHPDisplay.text(currentHP + (incrementorValue + currentTempHP))
  
        }

      }

    }

  }

  healOrDoDamage() {

    let input = $('[data-hp-controller-value]');
    let val = input.val();
    game.user.character.applyDamage(-(val));
    input.val(0);

  }

  changeTempHP(event) {

    let tempHP = $(event.currentTarget).val()
    game.user.character.update({"system.attributes.hp.temp": tempHP});

  }

  rollDeathSave() {

    game.user.character.rollDeathSave();

  }

  rollInitiative() {

    game.user.character.rollInitiative()
    this._tabs[0].activate('chat-message-tab')

  }

  rollDice() {
    return;
  }

  equipItem(event) {

    let itemId = $(event.target).data('equipItem');
    game.user.character.items.filter(item => item.id === itemId)[0].update({"system.equipped": true})

  }

  unequipItem(event) {

    let itemId = $(event.target).data('unequipItem');
    game.user.character.items.filter(item => item.id === itemId)[0].update({"system.equipped": false})

  }

  attuneItem(event) {

    let itemId = $(event.target).data('attuneItem');
    game.user.character.items.filter(item => item.id === itemId)[0].update({"system.attunement": 2})

  }

  unattuneItem(event) {

    let itemId = $(event.target).data('unattuneItem');
    game.user.character.items.filter(item => item.id === itemId)[0].update({"system.attunement": 1, "system.equipped": false})

  }

  showManageInventory() {

    this._tabs[0].activate('manage-inventory-tab');

  }

  showManageSpells() {

    this._tabs[0].activate('manage-spells-tab');

  }

  closeManageInventory() {

    this._tabs[0].activate('controller-tab');

  }

  closeManageSpells() {

    this._tabs[0].activate('controller-tab');

  }
  
  addItem(event) {

    let itemId = $(event.currentTarget).data('addItem');
    let item = this.equipmentCompendium.filter(item => item._id === itemId)[0]
    game.user.character.createEmbeddedDocuments("Item", [item.toObject()]);

  }

  addSpell(event) {

    let spellName = $(event.currentTarget).data('addSpell');
    let spell = this.spellCompendium.filter(spell => spell.name === spellName)[0]
    game.user.character.createEmbeddedDocuments("Item", [spell.toObject()]);

  }

  removeSpell(event) {
    let spellName = $(event.currentTarget).data('removeSpell');
    let spell = game.user.character.itemTypes.spell.filter(spell => spell.name === spellName)[0]
    // console.log(spell.id);
    game.user.character.deleteEmbeddedDocuments('Item', [spell.id]);

  }

  getActionList() {

    let actions = game.modules.get('character-actions-list-5e').api.getActorActionsData(game.user.character)
    
    Object.keys(actions).forEach(actionType => {
      actions[actionType] = this.sortItemsByName(Array.from(actions[actionType]))
    })
    
    return actions;

  }

  toggleSpellCompendiumLevelFilter(event) {
    
    let spellLevelFilter = $(event.target).data('spellLevel').toString();
    
    // Show all spell-levels
    if (spellLevelFilter === 'all-levels') {

      if (this.spellCompendiumFilters.includes('all-levels')) {
        return;
      } else {
        this.spellCompendiumFilters.push('all-levels')
        this.spellCompendiumFilters = this.spellCompendiumFilters.filter(filter => ['all-levels', 'known'].includes(filter))
      }

    } 

    // Filter known spells
    else if (spellLevelFilter === 'known') {

      if (this.spellCompendiumFilters.includes('known')) {
        this.spellCompendiumFilters = this.spellCompendiumFilters.filter(filter => filter !== 'known')
      } else {
        this.spellCompendiumFilters.push('known')
      }

    } 
    
    // Toggling a spell level between 0-9
    else {
      
      if (!this.spellCompendiumFilters.includes(spellLevelFilter)) {

        this.spellCompendiumFilters.push(spellLevelFilter)

      } 
      
      else {
        this.spellCompendiumFilters = this.spellCompendiumFilters.filter(filter => filter !== spellLevelFilter)
      }
     
      if (this.spellCompendiumFilters.includes('all-levels')) {
        this.spellCompendiumFilters = this.spellCompendiumFilters.filter(filter => !['all-levels'].includes(filter))
      } 

    }

    if ((this.spellCompendiumFilters.includes('known') && this.spellCompendiumFilters.length === 1) || this.spellCompendiumFilters.length === 0) {
      this.spellCompendiumFilters.push('all-levels')
    } 
    
    // this.spellCompendiumFilters = this.spellCompendiumFilters.filter(filter => filter !== spellLevel.toString());
    Hooks.call('simple-token-movement.openForm')
  }

  addChatMessage(chatMessage) {
    this.chatMessages.push(chatMessage)
    console.log(chatMessage)
  }

  clearChatMessages() {
    this.chatMessages = []
    this.render(true);
    this._tabs[0].activate('controller-tab');
  }

  handleNotificationsTouch(event) {

    let chatCardId = $(event.currentTarget).data('messageId');
    let chatCard = $('#chat-log > [data-message-id=' + chatCardId + ']');

    let action = $(event.target).data('action');

    if (action !== undefined) {
      chatCard.find(`[data-action=${action}]`).trigger('click');
    }

  }

  activateListeners(html) {

    super.activateListeners(html)

    // A wall of UI bindings :|
    $('.mtmc-select', html).bind('touchstart', $.proxy(this.selectToken, this))
    $('.mtmc-zoomin', html).bind('touchstart', $.proxy(this.zoomIn, this))
    $('.mtmc-zoomout', html).bind('touchstart', $.proxy(this.zoomOut, this))
    $('.mtmc-topleft', html).bind('touchstart', $.proxy(this.moveTopLeft, this))
    $('.mtmc-left', html).bind('touchstart', $.proxy(this.moveLeft, this))
    $('.mtmc-bottomleft', html).bind('touchstart', $.proxy(this.moveBottomLeft, this))
    $('.mtmc-top', html).bind('touchstart', $.proxy(this.moveTop, this))
    $('.mtmc-bottom', html).bind('touchstart', $.proxy(this.moveBottom, this))
    $('.mtmc-topright', html).bind('touchstart', $.proxy(this.moveTopRight, this))
    $('.mtmc-right', html).bind('touchstart', $.proxy(this.moveRight, this))
    $('.mtmc-bottomright', html).bind('touchstart', $.proxy(this.moveBottomRight, this))
    $('.token-controller-action', html).bind('touchstart', $.proxy(this.onTouchStart, this))
    $('.token-controller-action', html).bind('touchend', $.proxy(this.onTouchEnd, this))
    $('.token-controller-action', html).bind('touchmove', $.proxy(this.onTouchMove, this))
    $('[data-event-type=manage-conditions]', html).bind('touchstart', $.proxy(this.showConditionsManagement, this))
    $('[data-event-type=manage-rest]', html).bind('touchstart', $.proxy(this.showRestDialog, this))
    $('[data-event-type=manage-hp]', html).bind('touchstart', $.proxy(this.showHPManagement, this))
    $('[data-close-condition-management]', html).bind('touchstart', $.proxy(this.closeConditionManagement, this))
    $('[data-close-hp-management]', html).bind('touchstart', $.proxy(this.closeHPManagement, this))
    $('[data-increment]', html).bind('touchstart', $.proxy(this.incrementHPControllerValue, this))
    $('[data-damage-button]', html).bind('touchstart', $.proxy(this.healOrDoDamage, this))
    $('[data-temp-hp-controller-value]', html).bind('change', $.proxy(this.changeTempHP, this))
    $('[data-death-save-controller]', html).bind('touchstart', $.proxy(this.rollDeathSave, this))
    $('[data-roll-initiative]', html).bind('touchstart', $.proxy(this.rollInitiative, this))
    $('[data-roll-death-save]', html).bind('touchstart', $.proxy(this.rollDeathSave, this))
    $('[data-roll-dice]', html).bind('touchstart', $.proxy(this.rollDice, this))
    $('[data-equip-item]', html).bind('touchstart', $.proxy(this.equipItem, this));
    $('[data-unequip-item]', html).bind('touchstart', $.proxy(this.unequipItem, this));
    $('[data-attune-item]', html).bind('touchstart', $.proxy(this.attuneItem, this));
    $('[data-unattune-item]', html).bind('touchstart', $.proxy(this.unattuneItem, this));
    $('[data-manage-inventory]', html).bind('touchstart', $.proxy(this.showManageInventory, this));
    $('[data-manage-spells]', html).bind('touchstart', $.proxy(this.showManageSpells, this));
    $('[data-close-manage-inventory]', html).bind('touchstart', $.proxy(this.closeManageInventory, this));
    $('[data-close-manage-spells]', html).bind('touchstart', $.proxy(this.closeManageSpells, this));
    $('[data-add-item]', html).bind('touchstart', $.proxy(this.addItem, this));
    $('[data-add-spell]', html).bind('touchstart', $.proxy(this.addSpell, this));
    $('[data-remove-spell]', html).bind('touchstart', $.proxy(this.removeSpell, this));
    $('[data-spell-level]', html).bind('touchstart', $.proxy(this.toggleSpellCompendiumLevelFilter, this));
    $('[data-clear-chat-messages]', html).bind('touchstart', $.proxy(this.clearChatMessages, this));
    $('[data-message-id]', html).bind('touchstart', $.proxy(this.handleNotificationsTouch, this));
  }

  getData() {

    // debugger;

    return {
      abilityList: game.system.config.abilities,
      actionKeys: this.actionKeys,
      actionList: this.getActionList(),
      backgroundList: this.featuresByType().Background,
      character: game.user.character,
      characterClass: game.user.character.itemTypes.class[0],
      characterTabOrder: this.characterTabOrder,
      chatMessages: this.chatMessages,
      classList: this.featuresByType().Class,
      compendiumEquipment: this.equipmentCompendium,
      featList: this.featuresByType().Feat,
      featureList: this.featuresByType(),
      game: game,
      inventoryList: this.itemsByType(),
      maxPrepared: this.maxSpellsPrepared(),
      numCantripsKnown: this.numberOfSpellsKnown(true),
      numOfSpellsPrepared: this.numOfSpellsPrepared(),
      numSpellsKnown: this.numberOfSpellsKnown(false),
      raceList: this.featuresByType().Race,
      skillList: game.system.config.skills,
      spellCompendiumByLevel: this.filteredSpellCompendiumByLevel(),
      spellCompendiumFilters: this.spellCompendiumFilters,
      spellLevels: game.system.config.spellLevels,
      spellList: this.spellsByLevel(),
      spellSchools: game.system.config.spellSchools,
      spellSlots: this.spellSlots(),
      statusEffects: CONFIG.statusEffects,
      toHitRolls: game.user.character.items.filter(item => item.labels.toHit),
      totalHp: game.user.character.system.attributes.hp.value + game.user.character.system.attributes.hp.temp,
    }

  }

  async _updateObject(event, formData) {


  }
}
