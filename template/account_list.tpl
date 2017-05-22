	{foreach item=item from=$items}
	<div class='item' account_id='{$item->id}@{$item->instance}'>
		<div class='icon tooltip' tooltip='(i18n_0367):{$item->statuses_count} (i18n_0125):{$item->following_count} (i18n_0122):{$item->followers_count}'>
			<img src='{$item->avatar}'>
		</div>
		<div class='name'>
			<div><span class='account_display_name'>{$item->display_name}</span></div>
			<div><span class='account_instance'>@{$item->instance}</span></div>
		</div>
		<div class='buttons'>
			<a class='btn img home tooltip icon-home' tooltip='(i18n_0152)'></a>
			<a class='btn img local tooltip icon-users2' tooltip='(i18n_0363)'></a>
			<a class='btn img federated tooltip icon-earth' tooltip='(i18n_0364)'></a>
			<a class='btn img notifications tooltip icon-bell' tooltip='(i18n_0093)'></a>
		</div>
	</div>
	{/foreach}
