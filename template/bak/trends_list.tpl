	{foreach item=item from=$items}
	<div class='item'>
		<div class='container'>
			<div class='title'>
				<span query='{$item->query}'>{$item->name}</span>
			</div>
		</div>
	</div>
	{/foreach}
