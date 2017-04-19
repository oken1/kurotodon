	{foreach item=item from=$items}
	<div class='item'>
		<div class='title'>
			<span class='tooltip' tooltip='{$item->url}'>{$item->title}</span>
		</div>
		<div class='del'>
			<span class='icon-close'></span>
		</div>
	</div>
	{/foreach}
