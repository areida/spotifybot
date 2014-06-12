require(['$api/models', '$api/models#Session'], function(models) {

    var currentUser, debug, iconEmoji, nowPlaying, webhookSubdomain, webhookToken, webhookUri;

    currentUser      = {};
    debug            = $.jStorage.get('debug');
    postName         = $.jStorage.get('spotifybot-webook-post-name');
    iconEmoji        = $.jStorage.get('spotifybot-webook-icon-emoji');
    webhookSubdomain = $.jStorage.get('spotifybot-webook-subdomain');
    webhookToken     = $.jStorage.get('spotifybot-webook-token');
    webhookUri       = 'slack.com/services/hooks/incoming-webhook?token=';

    if ( ! iconEmoji)
    {
        iconEmoji = ':hex:';
    }

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
        var debug, name, subdomain, token;

        debug     = $('.js-debug').prop('checked');
        name      = $('.js-webhook-post-name').val();
        iconName  = $('.js-webhook-icon-emoji').val();
        subdomain = $('.js-webhook-subdomain').val();
        token     = $('.js-webhook-token').val();

        webhookSubdomain = subdomain;
        webhookToken     = token;

        $.jStorage.set('debug', debug);
        $.jStorage.set('spotifybot-webook-post-name', name);
        $.jStorage.set('spotifybot-webook-icon-emoji', iconName);
        $.jStorage.set('spotifybot-webook-subdomain', subdomain);
        $.jStorage.set('spotifybot-webook-token', token);
    };

    $('.js-debug').prop('checked', debug);
    $('.js-webhook-post-name').val(postName);
    $('.js-webhook-icon-emoji').val(iconEmoji);
    $('.js-webhook-subdomain').val(webhookSubdomain);
    $('.js-webhook-token').val(webhookToken);
    $('.js-save').on('click', updateWebhook);

    function updateStatus(track)
    {
        if ( ! webhookToken || ! webhookSubdomain)
            return;

        if (currentUser.name)
        {
            if (track !== null)
            {
                var artist = track.artists[0];

                var payload = {
                    icon_emoji : iconEmoji,
                    text       : linkify(artist.uri, artist.name) + ' - ' + linkify(track.uri, track.name),
                    username   : currentUser.name
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
