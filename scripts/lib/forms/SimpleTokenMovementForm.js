export class SimpleTokenMovementForm extends FormApplication {

  constructor(socket) {
    super();
    this.socket = socket;
    this.startElement;
    this.touchStartX;
    this.touchStartY; 
    this.scrolled;
    this.longTouchTimer;

    Hooks.on('createActiveEffect', function(effect) {

      if (effect.parent.id === game.user.character.id) {
        let selector = '[data-condition=' + effect.statuses.first() + ']'
        $(selector).toggleClass('active-effect');  
      }

    });

    Hooks.on('deleteActiveEffect', function(effect) {
      
      if (effect.parent.id === game.user.character.id) {
        let selector = '[data-condition=' + effect.statuses.first() + ']'
        $(selector).toggleClass('active-effect');  
      }

    });

    Hooks.on('updateActor', function(actor) {

      if (actor.id === game.user.character.id) {
          mainForm.render(true);
      }
  });

  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
        classes: ["form"],
        popOut: true,
        template: "modules/simple-token-movement/scripts/lib/forms/SimpleTokenMovementForm.html",
        id: "simple-token-movement",
        title: "Mobile Token Controller",
        height: 800,
        width: 400,
        minimizable: false,
        classes: ["simple-token-movement"],
        tabs: [
          { navSelector: ".token-controller-tabs", contentSelector: ".token-controller-content", initial: "tab1" }
        ]
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

  showDescription(event) {
    this.scrolled = true;
    $(event.currentTarget).find('.token-controller-action-description').first().toggleClass('hidden');
  }
  
  onTouchStart(event) {
    // Store the element where touchstart occurred
    this.startElement = event.currentTarget;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.scrolled = false;
    $(this.startElement).addClass('tapped');

    // Get element type and set a different timer based on what is tapped
    let eventType = $(this.startElement).data('eventType');

    this.longTouchTimer = setTimeout(this.showDescription.bind(this, event),500);

  }

  onTouchMove(event) {
    // Determine if the touch has moved significantly
    if (Math.abs(event.touches[0].clientX - this.touchStartX) > 10 || 
        Math.abs(event.touches[0].clientY - this.touchStartY) > 10) {
        this.scrolled = true;
        $(this.startElement).removeClass('tapped');
        clearTimeout(this.longTouchTimer);
    }
  } 

  onTouchEnd(event) {

    // Get the event type (ability, skill, action)
    let eventType = $(this.startElement).data('eventType');

    // Only trigger if there was no scroll
    if (event.currentTarget === this.startElement && !this.scrolled) { 

      // Abilities
      if (eventType === 'ability') {
        let ability = $(this.startElement).data('ability');
        game.user.character.rollAbility(ability);
      }

      // Skills
      if (eventType === 'skill') {
        let skill = $(this.startElement).data('skill');
        game.user.character.rollSkill(skill);
      }

      // Actions
      if (eventType === 'action') {
        let actionSubtype = $(this.startElement).data('actionSubtype')
        let actionIndex = $(this.startElement).data('actionIndex');
        let action = [...game.modules.get('character-actions-list-5e').api.getActorActionsData(game.user.character)[actionSubtype]][actionIndex]
        action.use();
      }

      // Spell
      if(eventType === 'spell') {
        let spellName = $(this.startElement).data('spellName');
        let actor = game.user.character;
        let spell = actor.itemTypes.spell.filter(_spell => _spell.name === spellName)[0];
        let spellLevel = spell.system.level
        let isPrepared = spell.system.preparation.prepared;
        let hasSpellSlots = this.spellSlots()
        
        spell.use();

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
    clearTimeout(this.longTouchTimer);

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

    return spellsByLevel;

  }

  // Create an inventory list, ordered by level
  itemsByType() {
    let itemsByType = {};

    game.user.character.items.filter(item => !['spell', 'feat', 'class', 'race', 'background'].includes(item.type)).forEach(item => {
        let itemType = this.toPluralCamelCase(item.type);
        if (!itemsByType[itemType]) {
            itemsByType[itemType] = [];
        }
        itemsByType[itemType].push(item);
    });

    return itemsByType;
  }

  // Create a list of character features, ordered by type
  featuresByType() {
    let featuresByType = {};

    game.user.character.items.filter(item => ['race','class','background','feat'].includes(item.type)).sort().forEach(item => {
      let itemType = this.toPluralCamelCase(item.type);
      if (!featuresByType[itemType]) {
          featuresByType[itemType] = [];
      }
      featuresByType[itemType].push(item);
    });

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
    $('#condition-management').show();
    $('#mobile-controller').hide();
    $('.window-content').scrollTop(0)
  }

  closeConditionManagement() {
    $('#condition-management').hide();
    $('#mobile-controller').show();
    $('.window-content').scrollTop(0)
  }

  showRestDialog() {

    let d = new Dialog({
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
     d.render(true);

  }

  showHPManagement() {
    $('#hp-management').show();
    $('#mobile-controller').hide();
    $('.window-content').scrollTop(0)
  }

  closeHPManagement() {
    $('#hp-management').hide();
    $('#mobile-controller').show();
    $('.window-content').scrollTop(0)
  }

  incrementHPControllerValue(event) {
    
    let input = $(event.currentTarget);
    let increment = input.data('increment');
    let updateButton = $('[data-damage-button="update"]');
    let currentValue = $('.hp-controller-value').val();
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

        $('.hp-controller-value').val(0);

      }
      
      let incrementorInput = $('.hp-controller-value').val( function(i, oldval) {

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
    let input = $('.hp-controller-value');
    let val = input.val();
    game.user.character.applyDamage(-(val));
    input.val(0);
  }

  activateListeners(html) {
    super.activateListeners(html)
    $('.mtmc-select', html).bind('touchstart click', $.proxy(this.selectToken, this))
    $('.mtmc-zoomin', html).bind('touchstart click', $.proxy(this.zoomIn, this))
    $('.mtmc-zoomout', html).bind('touchstart click', $.proxy(this.zoomOut, this))
    $('.mtmc-topleft', html).bind('touchstart click', $.proxy(this.moveTopLeft, this))
    $('.mtmc-left', html).bind('touchstart click', $.proxy(this.moveLeft, this))
    $('.mtmc-bottomleft', html).bind('touchstart click', $.proxy(this.moveBottomLeft, this))
    $('.mtmc-top', html).bind('touchstart click', $.proxy(this.moveTop, this))
    $('.mtmc-bottom', html).bind('touchstart click', $.proxy(this.moveBottom, this))
    $('.mtmc-topright', html).bind('touchstart click', $.proxy(this.moveTopRight, this))
    $('.mtmc-right', html).bind('touchstart click', $.proxy(this.moveRight, this))
    $('.mtmc-bottomright', html).bind('touchstart click', $.proxy(this.moveBottomRight, this))
    $('.token-controller-action', html).bind('touchstart click', $.proxy(this.onTouchStart, this))
    $('.token-controller-action', html).bind('touchend', $.proxy(this.onTouchEnd, this))
    $('.token-controller-action', html).bind('touchmove', $.proxy(this.onTouchMove, this))
    $('[data-event-type=manage-conditions]', html).bind('touchstart', $.proxy(this.showConditionsManagement, this))
    $('[data-event-type=manage-rest]', html).bind('touchstart', $.proxy(this.showRestDialog, this))
    $('[data-event-type=manage-hp]', html).bind('touchstart', $.proxy(this.showHPManagement, this))
    $('#close-condition-management', html).bind('touchstart', $.proxy(this.closeConditionManagement, this))
    $('#close-hp-management', html).bind('touchstart', $.proxy(this.closeHPManagement, this))
    $('[data-increment]', html).bind('touchstart', $.proxy(this.incrementHPControllerValue, this));
    $('[data-damage-button]', html).bind('touchstart', $.proxy(this.healOrDoDamage, this));
  }

  getData() {

      return {
        character: game.user.character,
        actionList: game.modules.get('character-actions-list-5e').api.getActorActionsData(game.user.character),
        actionKeys: Object.keys(game.modules.get('character-actions-list-5e').api.getActorActionsData(game.user.character)),
        skillList: game.system.config.skills,
        abilityList: game.system.config.abilities,
        spellList: this.spellsByLevel(),
        spellLevels: game.system.config.spellLevels,
        inventoryList: this.itemsByType(),
        featureList: this.featuresByType(),
        characterClass: game.user.character.itemTypes.class[0],
        numOfSpellsPrepared: this.numOfSpellsPrepared(),
        maxPrepared: this.maxSpellsPrepared(),
        spellSlots: this.spellSlots(),
        numCantripsKnown: this.numberOfSpellsKnown(true),
        numSpellsKnown: this.numberOfSpellsKnown(false),
        game: game,
        statusEffects: CONFIG.statusEffects,
        totalHp: game.user.character.system.attributes.hp.value + game.user.character.system.attributes.hp.temp
      }
  }

  async _updateObject(event, formData) {

  }
}
