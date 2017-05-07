<div class='panel_btns'>
	<div>
		<a id='cmnsetting_apply' class='btn panel_btn'>(i18n_0255)</a>
	</div>
</div>
<div id='cmnsetting_items'>
	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0247)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='title'>
				(i18n_0136)
			</div>
			<div class='slidercontainer'>
				<span class='slidestr'></span>
				<span id='cset_font_size'></span>
				<span class='slidestr'></span>
				<span id='cset_font_size_disp' class='value_disp'>{$param->font_size}px</span>
			</div>
		</div>
		<div class='group'>
			<div class='title'>
				(i18n_0300)
			</div>
			<div class='textboxcontainer'>
				<input type='text' maxlength='64' id='cset_font_family' value='{$param->font_family}'>
			</div>
		</div>
		<div class='group'>
			<div class='title'>
				(i18n_0340)
			</div>
			<div class='checkboxcontainer'>
				<span><input type='checkbox' id='cset_scroll_vertical' {if $param->scroll_vertical==1}checked{/if}></span>
				<span>(i18n_0341)</span>
			</div>
			<div class='checkboxcontainer'>
				<span><input type='checkbox' id='cset_scroll_horizontal' {if $param->scroll_horizontal==1}checked{/if}></span>
				<span>(i18n_0342)</span>
			</div>
		</div>
	</div>

	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0367)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='title'>
				(i18n_0086)
			</div>
			<div class='radiocontainer'>
				<div><input type='radio' name='cset_tootkey' value='0' {if $param->tootkey==0}checked{/if}>Ctrl+Enter</div>
				<div><input type='radio' name='cset_tootkey' value='1' {if $param->tootkey==1}checked{/if}>Shift+Enter</div>
				<div><input type='radio' name='cset_tootkey' value='2' {if $param->tootkey==2}checked{/if}>Enter</div>
			</div>
		</div>
	</div>

	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0309)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='title'>
				(i18n_0310)
			</div>
			<div class='textboxcontainer'>
				<input type='text' maxlength='140' id='cset_nowbrowsing_text' value='{$param->nowbrowsing_text}'>
			</div>
		</div>
	</div>
</div>
