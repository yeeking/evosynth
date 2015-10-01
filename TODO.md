Simple high level API:
// generate new set of individuals
evolib.newPop(size)

// listen to an individual
evolib.listen(ind)

// set listening position (0-1)
evolib.setPos(x,y)

// stop listening
evolib.stop

// select or unselect an individual for breeding
evolib.select(ind)
evolib.unselect(ind)

// generate next generation from selected individuals
evolib.breed

// play the fist individual then interpolate to the 
// second one in the requested time
evolib.listenInterpolate(ind1, ind2, time)

// get the graph
evolib.getGraph(ind)

