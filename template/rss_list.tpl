	{foreach item=item from=$items}
	{if $item->feedtitle}
	<div class='item feed'>
		<div class='container'>
			<div class='title'>
				<a href='{$item->feedlink}' class='anchor' target='_blank'>{$item->feedtitle}</a>
			</div>
		</div>
	</div>
	{else}
	<div class='item'>
		<div class='container'>
			<div class='title'>
				<a href='{$item->link}' class='anchor' target='_blank'>{$item->title}</a>
			</div>
			{if $showdesc}
			<div class='desc'>
				{if $item->description}{$item->description}{else}{/if}
			</div>
			{/if}
		</div>
	</div>
	{/if}
	{/foreach}
