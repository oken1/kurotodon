<div class='item' user_id='{$user_id}' user_instance='{$user_instance}' status_id='{$status_id}' created_at='{$created_at}'>
	<div class='avatar'>
		{if $following!='-'}<img class='tooltip' src='{$user_avatar}' tooltip='(i18n_0083):{$statuses_count} (i18n_0125):{$following} (i18n_0122):{$followers}'>{else}<img src='{$user_avatar}'>{/if}
		{if $bt_flg}
		<div class='boost tooltip' tooltip='(i18n_0001)' bt_user_id='{$bt_user_id}' bt_user_display_name='{$bt_user_display_name}'>
			<img src='{$bt_avatar}' class='bt_avatar'>
		</div>
		{/if}
	</div>
	<div class='toot'>
		<div class='headcontainer'>
			<div class='namedate'>
				<span class='display_name'>{if $user_display_name}{$user_display_name}{else}{$user_username}{/if}</span> <span class='username'>{$user_username}</span>

				{if $isfriend}<span class='icon-arrow-left'></span>{/if}{if $isfollower}<span class='icon-arrow-right'></span>{/if}

				<br>
				<span class='date tooltip' tooltip='{$date}'><a href='https://twitter.com/{$screen_name}/status/{$status_id}' target='_blank' class='anchor'>{$dispdate}</a></span><span class='source'>{$source}</span>
				<br>

				{if $btcnt > 0 || $favcnt > 0}
				<span class='btfav_cnt'>{if $btcnt > 0}<span class='icon-loop'></span>:{$btcnt}{/if} {if $favcnt > 0}<span class='icon-star'></span>:{$favcnt}{/if}</span>
				{/if}

			</div>

			<div class='options' mytoot='{$mytoot}' protected='{$protected}'>
				<span class='fav tooltip icon-star {if $favorited}on{else}off{/if}' tooltip='(i18n_0054)'></span>
			</div>

		</div>

		<div class='toot_text'>{$text}</div>
	</div>
</div>
