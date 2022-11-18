function lookup(v,data){if (v.constant == null){return data[v.lookup]}else{return v.constant}}
function key_by_name(data) { return data ? data.name : this.id; }
function key_by_id(data) { return data ? data.id : this.id; }

export function display_message(group,mess) {
  var messages = d3.select("#"+group)
  messages.append("p")
    .classed(mess.class,true)
    .text(mess.text)
  .transition()
    .style("background-color","yellow")
  .transition()
    .style("background-color",null)
  messages.each(function(){this.scrollTop = this.scrollHeight})
}

export function update_vals(vals) {
  d3.selectAll("val")
    .text(d=>{
      let n = lookup(d,vals)
      if (n != undefined) {
        return Math.floor(n).toLocaleString(undefined,{
          maximumFractionDigits: 0
        })
      } else { return "" }
    })
  d3.selectAll("clicker")
    .classed("disabled",d=>lookup(d.enabled,vals)<1)
  d3.selectAll("pbar").each(function(skill){
    d3.select(this).select("exp")
      .style("width", exp => {
        let m = lookup(skill.max,vals)
        let e = lookup(skill.exp,vals)
        let percent = m?100*e/m:0
        return (percent>100?100:percent) + "%"
      })
      .text(exp=>Math.round(lookup(skill.exp,vals))+"/"+Math.round(lookup(skill.max,vals)))
  })
  d3.selectAll("boxes").each(function(mbar){
    let lmax = Math.max.apply(null, mbar.values.map(v=>lookup(v,vals)));
    let mmax = mbar.max?lookup(mbar.max,vals):lmax
    d3.select(this)
    .selectAll("box-bg").each(function(box){
      let small_percent = (100*lookup(box.val,vals)/mmax)||0;
      d3.select(this)
      .style("width",small_percent+"%")
    })
  })
  d3.selectAll(".logic").each(function(entries){
    let logic = d3.select(this)
    for (var i = 0; i < entries.length; i++) {
      logic.attr(entries[i].name,lookup(entries[i].val,vals))
    }
  })
}

export function render_messages(group,values) {
  d3.select("#"+group).selectAll("message")
  .data(values,key_by_id)
  .join(enter=>enter.append("message").each(function(mess_data) {
    d3.select(this)
      .classed(mess_data.class,true)
      .text(mess_data.text)
  }))
}

export function render_values(group,values) {
  // console.log("render_values")
  d3.select("#"+group).selectAll("value").data(values,key_by_id)
    .join(enter=>enter.append("value")
      .text(d=>""+d.name + " ")
      .call(value=>value.append("val"))
      .call(value=>value.append("desc")
        .text(d=>d.desc)
      )
    )
}

export function render_bars(group,bars) {
  // console.log("render_bars")
  const zip = (arr1, arr2) => arr1.map((e, i) => {return{name:e, val:arr2[i]}})
  d3.select('#'+group).selectAll("multibar")
  .data(bars,key_by_id)
  .join(enter=>enter.append("multibar")
    .call(mbar=>mbar.append("main-label")
      .text(d=>d.name)
    ).call(mbar=>mbar.append("desc")
      .text(d=>d.desc)
    ).call(mbar=>mbar.append("boxes")
      .selectAll("box-bg")
      .data(d=>zip(d.names,d.values),key_by_name)
      .join(enter=>enter.append("box-bg")
        .call(box=>box.append("main-label")
          .text(d=>d.name)
        ).call(box=>box.append("val").datum(d=>d.val))
        .call(box=>box.append("box-fg").each(function(d){
          d3.select(this).classed(d.name,true)
        }))
      )
    ).each(function(bar_data) {
      if (bar_data.max) {
        d3.select(this).append("val").datum(bar_data.max)
      }
    })
  )
}

export function render_images(group,images) {
  // console.log("render_images")
  d3.select("#"+group).selectAll("image")
    .data(images,key_by_id)
    .join(enter=>enter.append("image")
      .call(image=>image.append("img")
        .attr("src",d=>"img/"+d.img)
      ).call(image=>image.append("desc")
        .text(d=>d.desc)
      ).call(image=>image.append("name")
        .text(d=>d.name)
      ).call(image=>image.append("val")
        .datum(d=>d.value)
      )
    )
}

export function render_buttons(group,buttons) {
  // console.log("render_buttons")
  d3.select("#"+group).selectAll("clicker")
    .data(buttons,key_by_id)
    .join(enter=>enter.append("clicker")
      .on("click",d=>handle_click(d.action))
      .each(function(button_data) {
        if (button_data.autoclick) {
          d3.select(this)
          .classed("autoclick",true)
          .on("mousedown",autoclick)
          .on("mouseleave",end_autoclick)
          .on("mouseup",end_autoclick)
          .on("touchstart",autoclick_touch)
          .on("touchend",end_autoclick)
          .on("touchcancel",end_autoclick)
        }
      }).call(clicker=>clicker.append("clickbox")
        .text(d=>d.name)
      )
      .append("desc")
        .text(d=>d.desc)
    )
}

function autoclick() {
  clearInterval(window.autoclicker)
  window.autoclicker = setInterval(()=>this.click(),100)
}
function autoclick_touch(e) {
  e.preventDefault()
  clearInterval(window.autoclicker)
  window.autoclicker = setInterval(()=>this.click(),100)
}
function end_autoclick() {
  clearInterval(window.autoclicker)
}

export function render_skills(group,skills) {
  d3.select("#"+group).selectAll("skill")
    .data(skills,data=>data.id)
    .join(enter => enter.append("skill")
      .call(skill => skill.append("name")
        .text(d => "" + d.name + " ")
        .append("desc")
          .text(d => d.desc)
      ).call(skill => skill.append("val")
        .datum(d => d.level)
      ).each(function(skill_data){
        d3.select(this).append("pline")
        .call(skill => skill.append("mult").append("val")
          .datum(skill_data.mult)
        ).append("pbar")
          .datum({exp:skill_data.exp,max:skill_data.max})
          .append("exp")
            .datum(skill_data.exp)
      }).each(function(skill_data){
        d3.select(this).append("clickers")
        .selectAll("clicker")
        .data(skill_data.buttons)
        .join(enter=>enter.append("clicker")
          .on("click",d=>handle_click(d.action))
          .each(function(button_data) {
            if (button_data.autoclick) {
              d3.select(this)
              .classed("autoclick",true)
              .on("mousedown",autoclick)
              .on("mouseleave",end_autoclick)
              .on("mouseup",end_autoclick)
              .on("touchstart",autoclick_touch)
              .on("touchend",end_autoclick)
              .on("touchcancel",end_autoclick)
            }
          }).call(clicker=>clicker.append("clickbox")
            .text(d=>d.name)
          ).append("desc")
            .text(d=>d.desc)
        )
      })
    )
}

export function render_logic(group,entries) {
  // console.log("render_logic")  
  d3.select("#"+group).classed("logic",true).datum(entries)
}