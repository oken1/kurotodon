	{foreach item=item from=$items}
	<div class='item' account_id='{$item->account_id}'>
		<div class='avatar'>
			<img src='{$item->avatar}'>
		</div>
		<div class='display_name'>
			{$item->display_name}@{$item->instance}
		</div>
	</div>
	{/foreach}
