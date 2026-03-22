/* Preview interakce pro Mystická Hvězda post náhledy */

function copyCaption() {
  var text = document.getElementById('post-preview').dataset.caption;
  var tags = document.getElementById('post-preview').dataset.hashtags;
  navigator.clipboard.writeText(text + '\n\n' + tags)
    .then(function() { alert('Caption + hashtags zkopírovány do schránky!'); })
    .catch(function() {
      var ta = document.createElement('textarea');
      ta.value = text + '\n\n' + tags;
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      alert('Zkopírováno!');
    });
}

function copyHashtags() {
  var tags = document.getElementById('post-preview').dataset.hashtags;
  navigator.clipboard.writeText(tags)
    .then(function() { alert('Hashtags zkopírovány!'); });
}

function selectVariant(i) {
  var cards = document.querySelectorAll('.variant-card');
  cards.forEach(function(c, idx) {
    c.style.borderColor = idx === i ? '#c9a227' : '#3a1a5e';
  });
}
