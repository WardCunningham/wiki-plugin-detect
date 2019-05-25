
(function() {
  var bind, emit, expand;

  expand = text => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*(.+?)\*/g, '<i>$1</i>');
  };

  function parse(text, $item) {
    let candidates = $(`.item:lt(${$('.item').index($item)})`)
    let who = candidates.filter('.server-source')
    if (who.size()) {
      let sources = $.map(who, (source) => {
        let service = source.service()
        console.log(service)
        return service.parse.output
      })
      return {output: expand(text)+"<p class=caption>"+sources.join('<hr>')+"</p>"}
    }
    return {output: expand(text)+"<p class=caption>can't find service to monitor</p>"}
  }

  function emit($item, item) {

    let parsed = parse(item.text, $item)
    $item.append(`
      <div style="background-color:#eee; padding:15px; margin-block-start:1em; margin-block-end:1em;">
        ${parsed.output}
        <center><button disabled>wait</button></center>
      </div>`);
  };


  function bind($item, item) {
    return $item.dblclick(() => {
      return wiki.textEditor($item, item);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.detect = {emit, bind};
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {expand};
  }

}).call(this);
