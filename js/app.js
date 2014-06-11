require(['$api/models', '$api/models#Session'], function(models) {

    var currentUser, nowPlaying, webhookSubdomain, webhookToken, webhookUri;

    currentUser      = {};
    webhookSubdomain = $.jStorage.get('spotifybot-webook-subdomain');
    webhookToken     = $.jStorage.get('spotifybot-webook-token');
    webhookUri       = 'slack.com/services/hooks/incoming-webhook?token=';

    models.session.load('product','connection','device','user').done(
        function(sess)
        {
            sess.user.load('name', 'username', 'subscribed').done(
                function(user)
                {
                    currentUser.name = user.name;
                }
            );
        }
    );

    function linkify(uri, text)
    {
        return '<' + uri + '|' + text + '>';
    };

    function updateWebhook()
    {
        var subdomain, token;

        subdomain = $('.js-webhook-subdomain').val();
        token     = $('.js-webhook-token').val();

        webhookSubdomain = subdomain;
        webhookToken     = token;

        $.jStorage.set('spotifybot-webook-subdomain', subdomain);
        $.jStorage.set('spotifybot-webook-token', token);
    };

    $('.js-webhook-subdomain').val(webhookSubdomain);
    $('.js-webhook-token').val(webhookToken);
    $('.js-save').on('click', updateWebhook);

    function updateStatus(track)
    {
        var debug = $('.js-debug').prop('checked');

        if ( ! webhookToken || ! webhookSubdomain)
            return;

        if (currentUser.name)
        {
            if (track !== null)
            {
                var artist = track.artists[0];

                var payload = {
                    text     : linkify(artist.uri, artist.name) + ' - ' + linkify(track.uri, track.name),
                    username : currentUser.name
                };

                if (debug)
                {
                    console.log(payload);
                }
                else
                {
                    $.post(
                        'https://' + webhookSubdomain + '.' + webhookUri + webhookToken,
                        JSON.stringify(payload),
                        null,
                        'json'
                    );
                }
            }
        }
        else
        {
            _.delay(updateStatus, 10, track);
        }
    };

    // update on load
    models.player.load('track').done(
        function(event)
        {
            if (event.playing)
            {
                updateStatus(event.track);
            }
        }
    );

    // update on change
    models.player.addEventListener(
        'change',
        function(event)
        {
            if (event.data.playing && event.data.position === 0)
            {
                updateStatus(event.data.track);
            }
        }
    );
});
