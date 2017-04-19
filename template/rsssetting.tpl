<div class='panel_btns'>
	<div>
		<a class='btn panel_btn rsssetting_apply'>(i18n_0255)</a>
	</div>
</div>
<div class='rsssetting_items'>
	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0180)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='textboxcontainer'>
				<span>(i18n_0075)</span>
				<span><input type='text' class='set_title' value='{$param->title}' maxlength='40'></span>
			</div>
		</div>
		<div class='group'>
			<div class='title'>
				(i18n_0228)
			</div>
			<div class='slidercontainer'>
				<span class='slidestr'></span>
				<span class='set_reload_time'></span>
				<span class='slidestr'></span>
				<span class='value_disp'>{$param->reload_time}(i18n_0272)</span>
			</div>
		</div>
		<div class='group'>
			<div class='title'>
				(i18n_0231)
			</div>
			<div class='slidercontainer'>
				<span class='slidestr'></span>
				<span class='set_count'></span>
				<span class='slidestr'></span>
				<span class='value_disp'>{$param->count}(i18n_0205)</span>
			</div>
		</div>
		<div class='group'>
			<div class='checkboxcontainer'>
				<span><input type='checkbox' class='set_showdesc' {if $param->showdesc==1}checked{/if}></span>
				<span>(i18n_0357)</span>
			</div>
		</div>
	</div>
	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0121)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='textboxcontainer'>
				<span>URL</span>
				<span><input type='text' class='set_feed' value='' maxlength='256'></span>
				<span><a class='btn feed_append disabled'>(i18n_0253)</a></span>
			</div>
		</div>
		<div class='group'>
			<div class='feed_list'>
			</div>
		</div>
	</div>
</div>
