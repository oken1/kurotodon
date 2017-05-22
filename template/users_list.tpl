	{foreach item=item from=$items}
	<div class='item' display_name='{$item->display_name}' id='{$item->id}' username='{$item->username}' instance='{$item->instance}' created_at='{$item->created_at}' avatar='{$item->avatar}'>
		<div class='avatar'>
			<img src='{$item->avatar}'>
		</div>
		<div class='container'>
			<div class='names'>
				<span class='display_name'>{$item->display_name}</span><br>
				<span class='username'>@{$item->username}@{$item->instance}</span>
			</div>
			<div class='counts'>
				(i18n_0367):{$item->statuses_count} (i18n_0125):{$item->following_count} (i18n_0122):{$item->followers_count}
			</div>
		</div>
	</div>
	{/foreach}
