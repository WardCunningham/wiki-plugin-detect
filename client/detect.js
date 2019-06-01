
(function() {

  function expand (text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*(.+?)\*/g, '<i>$1</i>');
  }

  function parse(text, $item) {
    console.log('parsing',text)
    let output = expand(text)
    let candidates = $(`.item:lt(${$('.item').index($item)})`)
    let who = candidates.filter('.server-source')
    let sources = []
    if (who.size()) {
      output += $.map(who, (item) => {
        let service = item.service()
        let source = {slugitem: `${service.slug}/${service.id}`}
        sources.push(source)
        return `<p class=caption>${service.parse.output}</p>`
      }).join("\n")
    } else {
      output += "<p class=caption>can't find service to monitor</p>"
    }
    console.log({sources, output})
    return {sources, output}
  }

  function emit($item, item) {
    console.log('parse',item.text)
    let parsed = parse(item.text, $item)
    $item.append(`
      <div style="background-color:#eee; padding:15px; margin-block-start:1em; margin-block-end:1em;">
        ${parsed.output}
        <center><button disabled>wait</button></center>
      </div>`);
  };


  function bind($item, item) {
    $item.dblclick(() => {
      action({action:'stop'})
      return wiki.textEditor($item, item);
    });

    let $button = $item.find('button')
    let parsed = parse(item.text, $item)

    function action(command) {
      $button.prop('disabled',true)
      $page = $item.parents('.page')
      if($page.hasClass('local')) {
        return
      }
      slug = $page.attr('id').split('_')[0]
      $.ajax({
        type: "POST",
        url: `/plugin/detect/${slug}/id/${item.id}`,
        data: JSON.stringify(command),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data){
          $button.text((data.status == 'active') ? 'stop' : 'start')
          $button.prop('disabled',false)
        },
        failure: function(err) {
          console.log(err)
        }
      })
    }
    $button.click(event => action({action:$button.text(),schedule:{sources:parsed.sources}}))
    action({})
  }

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.detect = {emit, bind};
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {expand};
  }

}).call(this);
