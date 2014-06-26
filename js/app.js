require(['$api/models', '$api/models#Session'], function(models) {

    window.DEBUG_PAYLOAD = false;
    window.PREVENT_SEND  = false;

    var WEBHOOK_URI = 'slack.com/services/hooks/incoming-webhook?token=';

    var app = {
            emoji     : $.jStorage.get('spotifybot-webhook-icon-emoji'),
            user      : {},
            subdomain : $.jStorage.get('spotifybot-webhook-subdomain'),
            token     : $.jStorage.get('spotifybot-webhook-token'),
            track     : $.jStorage.get('spotifybot-now-playing')
        };

    function webhookUrl()
    {
        return 'https://' + app.subdomain + '.' + WEBHOOK_URI + app.token;
    };

    function linkify(uri, text)
    {
        return '<' + uri + '|' + text + '>';
    };

    function updateWebhook()
    {
        var emoji     = $('.js-webhook-emoji').val(),
            subdomain = $('.js-webhook-subdomain').val(),
            token     = $('.js-webhook-token').val();

        app.emoji     = emoji;
        app.subdomain = subdomain;
        app.token     = token;

        $.jStorage.set('spotifybot-webhook-icon-emoji', emoji);
        $.jStorage.set('spotifybot-webhook-subdomain', subdomain);
        $.jStorage.set('spotifybot-webhook-token', token);

        $('.js-notifications').text('Options saved.');

        setTimeout(function() {
           $('.js-notifications').text('');
        }, 750);
    };

    function updateStatus(track)
    {
        var artist, payload;

        if ( ! app.subdomain)
        {
            console.log('Missing webhook subdomain');

            return;
        }

        if ( ! app.token)
        {
            console.log('Missing webhook token');

            return;
        }

        // Track has changed
        if ( ! app.track || track.uri !== app.track.uri)
        {
            app.track = track;
            $.jStorage.set('spotifybot-now-playing', track);

            artist  = track.artists[0];
            payload = {
                icon_emoji : app.emoji,
                text       : linkify(artist.uri, artist.name) + ' - ' + linkify(track.uri, track.name),
                username   : app.user.name
            };

            if ( ! window.PREVENT_SEND)
            {
                $.post(
                    webhookUrl(),
                    JSON.stringify(payload),
                    null,
                    'json'
                );
            }

            if (window.DEBUG_PAYLOAD)
            {
                console.log(payload);
            }
        }
    };

    // Initialize the settings inputs
    $('.js-webhook-emoji').val(app.emoji);
    $('.js-webhook-subdomain').val(app.subdomain);
    $('.js-webhook-token').val(app.token);
    $('.js-save').on('click', updateWebhook);

    // Get the current user
    models.session.load('product','connection','device','user').done(
        function(sess)
        {
            sess.user.load('name', 'username', 'subscribed').done(
                function(user)
                {
                    app.user = user;

                    // Update current song
                    models.player.load('track').done(
                        function(event)
                        {
                            if (event.playing && event.track)
                            {
                                updateStatus(event.track);
                            }
                        }
                    );

                    // Update on change
                    models.player.addEventListener(
                        'change',
                        function(event)
                        {
                            if (event.data.playing && event.data.position === 0 && event.data.track)
                            {
                                updateStatus(event.data.track);
                            }
                        }
                    );
                }
            );
        }
    );
});
