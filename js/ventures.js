/* Stack Ventures: "Apply" buttons pre-fill the application form with the track and brief */
(function () {
  var form = document.querySelector('.vn-form'); if (!form) return;
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#apply"]'); if (!a) return;
    var track = a.getAttribute('data-track'), brief = a.getAttribute('data-brief');
    if (track) { var s = form.querySelector('[name=track]'); Array.prototype.forEach.call(s.options, function (o) { if (o.text === track) s.value = o.value || o.text; }); }
    form.querySelector('[name=brief]').value = brief || '';
    var msg = form.querySelector('[name=message]');
    if (brief && !msg.value) msg.value = 'I would like to lead the "' + brief + '" brief. My background: ';
    setTimeout(function () { (form.querySelector('[name=name]')).focus({ preventScroll: true }); }, 600);
  });
})();
