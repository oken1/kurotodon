<div class='item' id='{$id}' instance='{$instance}' display_name='{$display_name}' avatar='{$avatar}' username='{$username}' status_id='{$status_id}' created_at='{$created_at}'>
	<div class='avatar'>
		{if $following!='-'}<img class='tooltip' src='{$avatar}' tooltip='(i18n_0367):{$statuses_count} (i18n_0125):{$following} (i18n_0122):{$followers}'>{else}<img src='{$avatar}'>{/if}
		{if $bt_flg}
		<div class='boost tooltip' tooltip='(i18n_0001)' bt_id='{$bt_id}' bt_instance='{$bt_instance}' bt_display_name='{$bt_display_name}' bt_username='{$bt_username}'>
			<img src='{$bt_avatar}' class='bt_avatar'>
		</div>
		{/if}
	</div>
	<div class='toot'>
		<div class='headcontainer'>
			<div class='namedate'>
				<span class='display_name'>{if $display_name}{$display_name}{else}{$username}{/if}</span> <span class='username'>{$username}</span>

<!--
				{if $isfriend}<span class='icon-arrow-left'></span>{/if}{if $isfollower}<span class='icon-arrow-right'></span>{/if}
-->

				<br>
				<span class='date tooltip' tooltip='{$date}'><a href='{$url}' rel="nofollow noopener noreferrer" target='_blank' class='anchor'>{$dispdate}</a></span><span class='source'>{$source}</span>
				<br>

				{if $btcnt > 0 || $favcnt > 0}
				<span class='btfav_cnt'>{if $btcnt > 0}<span class='icon-loop'></span>:{$btcnt}{/if} {if $favcnt > 0}<span class='icon-star'></span>:{$favcnt}{/if}</span>
				{/if}

			</div>

			<div class='options' mytoot='{$mytoot}' protected='{$protected}'>
				<span class='fav tooltip icon-star {if $favorited}on{else}off{/if}' tooltip='(i18n_0054)'></span>
			</div>

		</div>

		{if $spoiler_text}<div class='spoiler_text'>{$spoiler_text} <span class='showmore_button'>(i18n_0368)</span></div>{/if}
		
		<div class='toot_text {if $spoiler_text}off{/if}'>{$text}</div>
	</div>
</div>
