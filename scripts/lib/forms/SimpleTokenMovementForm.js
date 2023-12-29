export class SimpleTokenMovementForm extends FormApplication {

    constructor(socket) {
      super();
      this.socket = socket;
      this.actionList = game.modules.get('character-actions-list-5e').api.getActorActionsData(game.user.character);
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
            title: "Simple Token Movement",
            height: 434,
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

      // Depending on the event type, do a thing
      if (eventType === 'ability') {
        let ability = $(this.startElement).data('ability');
        game.user.character.rollAbility(ability);
      }

      if (eventType === 'skill') {
        let skill = $(this.startElement).data('skill');
        game.user.character.rollSkill(skill);
      }

      if (eventType === 'action') {
        let actionSubtype = $(this.startElement).data('actionSubtype')
        let actionIndex = $(this.startElement).data('actionIndex');
        let action = [...this.actionList[actionSubtype]][actionIndex]
        action.use();
      }

    }
     
    // Reset the startElement for the next touch
    this.startElement = null;
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
        actionList: this.actionList,
        skillList: game.system.config.skills,
        abilityList: game.system.config.abilities
      }
  }

  async _updateObject(event, formData) {

  }
}
