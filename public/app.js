//Scrape
$("#scrape").on("click", function() {
    $.ajax({
        method: "GET",
        url: "/scrape",
    }).done(function(data) {
        window.location = "/"
    })
});

//Save Article
$(".save").on("click", function() {
    var newID = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/articles/save/" + newID
    }).done(function(data) {
        window.location = "/"
    })
});

//Delete Article
$(".delete").on("click", function() {
    var newID = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/articles/delete/" + newID
    }).done(function(data) {
        window.location = "/saved"
    })
});

//Save Note
$(".saveNote").on("click", function() {
    var newID = $(this).attr("data-id");
      $.ajax({
            method: "POST",
            url: "/notes/save/" + newID,
            data: {
              text: $("#noteText" + newID).val()
            }
          }).done(function(data) {
              $("#noteText" + newID).val("");
              window.location = "/saved"
          });
    });

//Delete Note
$(".deleteNote").on("click", function() {
    var noteId = $(this).attr("data-note-id");
    var articleId = $(this).attr("data-article-id");
    $.ajax({
        method: "DELETE",
        url: "/notes/delete/" + noteId + "/" + articleId
    }).done(function(data) {
        $(".modalNote").modal("hide");
        window.location = "/saved"
    })
});
