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

  doAction(event) {
    let actionType= $(event.currentTarget).data('actionType');
    let actionIndex = $(event.currentTarget).data('actionIndex')
    let action = [...this.actionList[actionType]][actionIndex]
    action.use();
  }

  onTouchStart(event) {
    // Store the element where touchstart occurred
    this.startElement = event.currentTarget;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.scrolled = false;
    console.log(`${this.touchStartX}, ${this.touchStartY}`)
  }

  onTouchMove(event) {
    // Determine if the touch has moved significantly
    if (Math.abs(event.touches[0].clientX - this.touchStartX) > 10 || 
        Math.abs(event.touches[0].clientY - this.touchStartY) > 10) {
        this.scrolled = true;
    }
  } 

  onTouchEnd(event) {
    let eventType = $(this.startElement).data('actionType');
    let eventIndex = $(this.startElement).data('actionIndex');
    let action = [...this.actionList[eventType]][eventIndex]

    // Check if the touchend event is on the same element
    if (event.currentTarget === this.startElement && !this.scrolled) {
        action.use();
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
    $('[data-action-type][data-action-index].token-controller-action', html).bind('touchstart', $.proxy(this.onTouchStart, this))
    $('[data-action-type][data-action-index].token-controller-action', html).bind('touchend', $.proxy(this.onTouchEnd, this))
    $('[data-action-type][data-action-index].token-controller-action', html).bind('touchmove', $.proxy(this.onTouchMove, this))
  }

  getData() {
      return {
        character: game.user.character,
        actionList: this.actionList
      }
  }

  async _updateObject(event, formData) {

  }
}
