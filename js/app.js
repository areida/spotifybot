require(['$api/models', '$api/models#Session'], function(models) {

    var currentUser      = {},
        iconEmoji        = $.jStorage.get('spotifybot-webhook-icon-emoji'),
        nowPlaying       = $.jStorage.get('spotifybot-now-playing'),
        webhookSubdomain = $.jStorage.get('spotifybot-webhook-subdomain'),
        webhookToken     = $.jStorage.get('spotifybot-webhook-token'),
        webhookUri       = 'slack.com/services/hooks/incoming-webhook?token=';

    window.DEBUG_SPOTIFYBOT = false;

    function linkify(uri, text)
    {
        return '<' + uri + '|' + text + '>';
    };

    function updateWebhook()
    {
        var name, subdomain, token;

        iconName  = $('.js-webhook-icon-emoji').val();
        subdomain = $('.js-webhook-subdomain').val();
        token     = $('.js-webhook-token').val();

        webhookSubdomain = subdomain;
        webhookToken     = token;

        $.jStorage.set('spotifybot-webhook-icon-emoji', iconName);
        $.jStorage.set('spotifybot-webhook-subdomain', subdomain);
        $.jStorage.set('spotifybot-webhook-token', token);
    };

    $('.js-webhook-icon-emoji').val(iconEmoji);
    $('.js-webhook-subdomain').val(webhookSubdomain);
    $('.js-webhook-token').val(webhookToken);
    $('.js-save').on('click', updateWebhook);

    function updateStatus(track)
    {
        if ( ! webhookToken || ! webhookSubdomain)
        {
            if ( ! webhookToken)
            {
                console.log('Missing webhookToken');
            }

            if ( ! webhookToken)
            {
                console.log('Missing webhookToken');
            }

            return;
        }

        if (nowPlaying && track.uri === nowPlaying.uri)
            return;

        nowPlaying = track;
        $.jStorage.set('spotifybot-now-playing', track);

        var artist = track.artists[0];

        var payload = {
            icon_emoji : iconEmoji,
            text       : linkify(artist.uri, artist.name) + ' - ' + linkify(track.uri, track.name),
            username   : currentUser.name
        };

        $.post(
            'https://' + webhookSubdomain + '.' + webhookUri + webhookToken,
            JSON.stringify(payload),
            null,
            'json'
        );

        if (window.DEBUG_SPOTIFYBOT)
        {
            console.log(payload);
        }
    };

    // Get the current user
    models.session.load('product','connection','device','user').done(
        function(sess)
        {
            sess.user.load('name', 'username', 'subscribed').done(
                function(user)
                {
                    currentUser.name = user.name;

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
