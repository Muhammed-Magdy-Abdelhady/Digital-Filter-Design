var checkList = document.getElementById('list1');
checkList.getElementsByClassName('anchor')[0].onclick = function () {
  if (checkList.classList.contains('visible'))
  checkList.classList.remove('visible');
  else
  checkList.classList.add('visible');
}


let zplanecanvas = document.getElementById("zplanecanvas");
let ctxzplane = zplanecanvas.getContext("2d");
let type = "zeros";
let hittype;
let magnitude;
let angle;
let w;
let zerosvalues;
let polesvalues;
let hit;
let allpassfilterszeros = [];
let allpassfilterspoles = [];
let slidervalue = 10;
let signalIterator = 125;
let $canvas = $("#zplanecanvas");
let canvasOffset = $canvas.offset();
let offsetX = canvasOffset.left;
let offsetY = canvasOffset.top;
let cw = zplanecanvas.width;
let ch = zplanecanvas.height;

drawfrequencyreposne([], [], [], "myDiv", '', '');
drawfrequencyreposne([], [], [], "realTimeSignal", '', '');

// flag to indicate a drag is in process
// and the last XY position that has already been processed
let isDown = false;
let lastX;
let lastY;

// the radian value of a full circle is used often, cache it
let PI2 = Math.PI * 2;

// letiables relating to existing zeros and poles
let zeros = [];
let poles = [];
let draggingelement = -1;

function getvalues(element) {
  return ([((element[0] - 150) / 100), (-(element[1] - 150) / 100)])
}

function drawfrequencyreposne(w, magnitude, angle, div, label1, label2) {
  let trace1 = {
    x: w,
    y: magnitude,
    type: 'lines',
    name: label1,
    marker: {
      color: 'rgb(3, 102, 60)'
    }
  };

  let trace2 = {
    x: w,
    y: angle,
    xaxis: 'x2',
    yaxis: 'y2',
    type: 'lines',
    name: label2,
    marker: {
      color: 'rgb(173, 248, 2)'
    }
  };

  let data = [trace1, trace2];

  let layout = {
    grid: {
      rows: 2,
      columns: 1,
      pattern: 'independent'
    },
    plot_bgcolor:"#f1f1f1",
    paper_bgcolor:"#0000",
  };

  Plotly.newPlot(div, data, layout);

}
drawPlane(ctxzplane);

function drawPlane(context) {
  context.beginPath();
  context.arc(150, 150, 100, 0, 2 * Math.PI);
  context.stroke();
  context.moveTo(10, 150);
  context.lineTo(290, 150);
  context.stroke();
  context.moveTo(150, 10);
  context.lineTo(150, 290);
  context.strokeStyle = '#000000';
  context.stroke();
  context.closePath();
}

function changeType() {
  type = $('input[name="type"]:checked').val();
}




function drawAll(context, allzeros, allpoles, color) {



  drawPlane(context);
  for (let i = 0; i < allzeros.length; i++) {
    let zero = allzeros[i];
    context.beginPath();
    context.strokeStyle = color;
    context.arc(zero[0], zero[1], 6, 0, PI2);
    if (hittype == 'zeros' && i == hit) {
      context.strokeStyle = '#ff0000';

    }
    context.stroke();
    context.closePath();

  }

  for (let i = 0; i < allpoles.length; i++) {
    let pole = allpoles[i];
    let x = pole[0];
    let y = pole[1];
    context.beginPath();
    context.moveTo(x + 6 / Math.sqrt(2), y + 6 / Math.sqrt(2));
    context.lineTo(x - 6 / Math.sqrt(2), y - 6 / Math.sqrt(2));
    context.moveTo(x + 6 / Math.sqrt(2), y - 6 / Math.sqrt(2));
    context.lineTo(x - 6 / Math.sqrt(2), y + 6 / Math.sqrt(2));
    context.strokeStyle = color;
    if (hittype != 'zeros' && i == hit) {
      context.strokeStyle = '#ff0000';
    }
    context.stroke();
    context.closePath();
  }
}

function handleMouseDown(e) {

  // tell the browser we'll handle this event
  e.preventDefault();
  e.stopPropagation();
  // save the mouse position
  // in case this becomes a drag operation
  lastX = parseInt(e.clientX - offsetX);
  lastY = parseInt(e.clientY - offsetY);
  hit = -1;
  // hit test all existing zeros
  for (let i = 0; i < zeros.length; i++) {
    let zero = zeros[i];
    let dx = lastX - zero[0];
    let dy = lastY - zero[1];
    if (dx * dx + dy * dy < 6 * 6) {
      hit = i;
      hittype = "zeros"
      $("#coordinates").html("(" + ((zero[0] - 150) / 100) + "," + (-(zero[1] - 150) / 100) + ")");

    }
  }
  // hit test all existing poles
  for (let i = 0; i < poles.length; i++) {
    let pole = poles[i];
    let dx = lastX - pole[0];
    let dy = lastY - pole[1];
    if (dx * dx + dy * dy < 6 * 6) {
      hit = i;
      hittype = "poles"
      $("#coordinates").html("(" + ((pole[0] - 150) / 100) + "," + (-(pole[1] - 150) / 100) + ")");
    }
  }


  // if no hits then add a zeros or pole
  // if hit then set the isDown flag to start a drag
  if (hit < 0) {
    if (type == "zeros") {
      hittype = 'zeros';
      hit = zeros.length
      zeros.push([lastX, lastY]);
    } else {
      hittype = 'poles';
      hit = poles.length
      poles.push([lastX, lastY]);
    }
    $("#coordinates").html("(" + ((lastX - 150) / 100) + "," + (-(lastY - 150) / 100) + ")");
  } else {

    if (hittype == "zeros") {
      draggingelement = zeros[hit];
    } else {
      draggingelement = poles[hit];
    }

    isDown = true;
  }
  updatefrequencyrespose();


}


function handleMouseUp(e) {
  // tell the browser we'll handle this event
  e.preventDefault();
  e.stopPropagation();

  // stop the drag
  isDown = false;
}

function handleMouseMove(e) {
  // if we're not dragging, just exit
  if (!isDown) {
    return;
  }

  // tell the browser we'll handle this event
  e.preventDefault();
  e.stopPropagation();

  // get the current mouse position
  mouseX = parseInt(e.clientX - offsetX);
  mouseY = parseInt(e.clientY - offsetY);

  // calculate how far the mouse has moved
  // since the last mousemove event was processed
  let dx = mouseX - lastX;
  let dy = mouseY - lastY;

  // reset the lastX/Y to the current mouse position
  lastX = mouseX;
  lastY = mouseY;

  // change the target circles position by the
  // distance the mouse has moved since the last
  // mousemove event
  draggingelement[0] += dx;
  draggingelement[1] += dy;


  $("#coordinates").html("(" + ((lastX - 150) / 100) + "," + (-(lastY - 150) / 100) + ")");
  // redraw all the circles
  updatefrequencyrespose();

}

function getSignals() {
  sliderValue()
  arr = [signalIterator];
  data = JSON.stringify(arr);
  $.ajax({
    url: '/getSignals',
    type: 'post',
    contentType: 'application/json',
    dataType: 'json',
    data: data,
    success: function(response) {
      // console.log(slidervalue)
      xData = response.xAxisData;
      yData = response.yAxisData;
      filtered = response.filter;
      length = response.datalength;
      signalIterator = signalIterator + 1;
      drawfrequencyreposne(xData, yData, filtered, 'realTimeSignal', 'signal', 'filtered Signal');
      if (signalIterator + 1 < length) {
        console.log(3000/slidervalue)
        setTimeout(getSignals, 3000/slidervalue);
      }
    }
  });
}
 // first part the slider val
function sliderValue() {
  // oldmult = signalIterator * slidervalue;
  x = document.getElementById("sliderChunks");
  slidervalue = x.value;
  // signalIterator = parseInt(oldmult / slidervalue);
}

function sendzeros() {
  zerosvalues = zeros.map(getvalues);
  let js_zeros = JSON.stringify(zerosvalues);
  $.ajax({
    url: '/getzeros',
    type: 'post',
    contentType: 'application/json',
    dataType: 'json',
    data: js_zeros
  });
}

function sendpoles() {
  polesvalues = poles.map(getvalues)
  let js_poles = JSON.stringify(polesvalues);

  $.ajax({
    url: '/getpoles',
    type: 'post',
    contentType: 'application/json',
    dataType: 'json',
    data: js_poles
  });
}

function updatefrequencyrespose() {
  sendzeros();
  sendpoles();
  $.ajax({
    url: '/sendfrequencyresposedata',
    type: 'get',
    success: function(response) {
      data = response;
      magnitude = data.magnitude;
      w = data.w;
      angle = data.angle;
      drawfrequencyreposne(w, magnitude, angle, 'myDiv', 'magnitude', 'angle');
      ctxzplane.clearRect(0, 0, cw, ch);
      drawAll(ctxzplane, zeros, poles, '#0000FF');
      drawAll(ctxzplane, allpassfilterszeros, allpassfilterspoles, '#91b233')
    }
  });
}
const inputElement = document.getElementById("signalFile");
inputElement.addEventListener("change", handleFiles, true);

function handleFiles() {
  var path = inputElement.value.split("\\"); /* now you can work with the file list */
  sendPath = JSON.stringify(path.at(-1));
  $.ajax({
    url: '/getData',
    type: 'post',
    contentType: 'application/json',
    dataType: 'json',
    data: sendPath,
    success: function() {
      console.log(signalIterator);
      getSignals();
    }
  })
}



//youssef
//Responsible for deleting of a specific zero or pole
function deleteFreq() {
  getFrequencyArray().splice(hit, 1);
  updatefrequencyrespose();
}

// Deleting All zeros
function clearallZeros() {
  zeros.splice(0, zeros.length);
  updatefrequencyrespose();
}
// Deleting ALL poles
function clearallPoles() {
  poles.splice(0, poles.length);
  updatefrequencyrespose();
}

function clearAll() {
  zeros.splice(0, zeros.length);
  poles.splice(0, poles.length);
  updatefrequencyrespose();
}

//Used to add a conjugate
function addConjugate() {
  temp = getFrequencyArray()[hit];
  if (temp[1] > 150) {
    temp = [temp[0], temp[1] - 2 * (150 - temp[1])];
  } else {
    temp = [temp[0], temp[1] + 2 * (150 - temp[1])];
  }
  getFrequencyArray().push([temp[0], (temp[1])]);
  ctxzplane.clearRect(0, 0, cw, ch);
  updatefrequencyrespose();
}


// Call this function to know whether you want the zeros or poles array of objects AND RETURNS IT
function getFrequencyArray() {
  if (hittype == "zeros") {
    return zeros;
  } else {
    return poles;
  }
}








// listen for mouse events

document
  .getElementById("zplanecanvas")
  .addEventListener("mousedown", function(e) {
    handleMouseDown(e);
  });
document
  .getElementById("zplanecanvas")
  .addEventListener("mousemove", function(e) {
    handleMouseMove(e);

  });
document.getElementById("zplanecanvas").addEventListener("mouseup", function(e) {
  handleMouseUp(e);
  drawfrequencyreposne(w, magnitude, angle, 'myDiv', 'magnitude', 'angle');

});
document
  .getElementById("zplanecanvas")
  .addEventListener("mouseout", function(e) {
    handleMouseUp(e);
  })

$(".side-button").click(function() {
  if ($(this).css("right") == "0px") {
    $(this).animate({
      right: $('.sidebar').outerWidth()
    }, 500);
    $(".sidebar").animate({
      right: "0"
    }, 500);
  } else {
    $(this).animate({
      right: "0"
    }, 500);
    $(".sidebar").animate({
      right: -$('.sidebar').outerWidth()
    }, 500);
  }
});