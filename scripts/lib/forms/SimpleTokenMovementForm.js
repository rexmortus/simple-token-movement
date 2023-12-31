export class SimpleTokenMovementForm extends FormApplication {

  constructor(socket) {
    super();
    this.socket = socket;
    this.startElement;
    this.touchStartX;
    this.touchStartY; 
    this.scrolled;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
        classes: ["form"],
        popOut: true,
        template: "modules/simple-token-movement/scripts/lib/forms/SimpleTokenMovementForm.html",
        id: "simple-token-movement",
        title: "Mobile Token Controller",
        height: 600,
        width: 374,
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

  onTouchStart(event) {
    // Store the element where touchstart occurred
    this.startElement = event.currentTarget;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.scrolled = false;
  }

  onTouchMove(event) {
    // Determine if the touch has moved significantly
    if (Math.abs(event.touches[0].clientX - this.touchStartX) > 10 || 
        Math.abs(event.touches[0].clientY - this.touchStartY) > 10) {
        this.scrolled = true;
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
        
        if (spellLevel != 0) {
          const updates = [{_id: spell.id, "system.preparation": { mode: "prepared", prepared: !isPrepared }}];
          actor.updateEmbeddedDocuments("Item", updates);
        }

      }

    }
     
    // Reset the startElement for the next touch
    this.startElement = null;
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
    $('.token-controller-action', html).bind('touchstart', $.proxy(this.onTouchStart, this))
    $('.token-controller-action', html).bind('touchend', $.proxy(this.onTouchEnd, this))
    $('.token-controller-action', html).bind('touchmove', $.proxy(this.onTouchMove, this))
  }

  getData() {

      return {
        character: game.user.character,
        actionList: game.modules.get('character-actions-list-5e').api.getActorActionsData(game.user.character),
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
        numSpellsKnown: this.numberOfSpellsKnown(false)
      }
  }

  async _updateObject(event, formData) {

  }
}
