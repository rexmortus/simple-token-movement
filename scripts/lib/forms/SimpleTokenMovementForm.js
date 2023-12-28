export class SimpleTokenMovementForm extends FormApplication {

    constructor(socket) {
      super();
      this.socket = socket;
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

  async _renderInner(...args) {
    const html = await super._renderInner(...args);
    const actionsListApi = game.modules.get('character-actions-list-5e').api;

    try {
      const actionsTab = html.find('.simple-token-controller-actions');
      const actionsTabHtml = $(await actionsListApi.renderActionsList(game.user.character));
      actionsTab.html(actionsTabHtml);
    } catch (e) {
      log(true, e);
    }

    return html;
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
  }

    getData() {

        // Create an object that is passed to the view template
        return {
          character: game.user.character
        };
    }

    async _updateObject(event, formData) {
    }
}
