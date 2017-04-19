	{foreach item=item from=$items}
	<div class='item' account_id='{$item->id}@{$item->instance}'>
		<div class='icon'>
			<img src='{$item->avatar}'>
		</div>
		<div class='name'>
			{$item->display_name}@{$item->instance}
		</div>
	</div>
	{/foreach}
