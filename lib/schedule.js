//
// hook.io-smart hook - adds and removes jobs that emit Hook events on customizable time intervals
//
var Hook = require('hook.io').Hook,
    util = require('util'),
    cron = require('cron');

function ScheduleHook(options) {

  var self = this;

  Hook.call(self, options);

  self.config.use('file', {
    file: './config.json'
  });

  self.on('*::scheduleJob', function(data) {
    self.addJob(data);
  });
  
  self.on('*::unscheduleJob', function(data) {
    self.removeJob(data);
  });

  self.on('hook::ready', function() {
    self._start();
  });
}

// ScheduleHook inherits from Hook
util.inherits(ScheduleHook, Hook);

ScheduleHook.prototype._start = function() {
  var self = this;
  
  var jobs = self.config.get('jobs') || [];
  jobs.forEach(function addSchedule(job){
    job._scheduleId = new cron.CronJob(job.schedule, function fireJob(){
      self.emit(job.event, job.data);
    });
  });
  self.config.set('jobs', jobs);
  self.config.save();
};


ScheduleHook.prototype.addJob = function(job) {

  var self = this;

  var jobs = self.config.get('jobs') || [];
  job.name = job.name || 'no name';
  
  if(!job.schedule )
    return console.log("job do not provide a schedule :", job);

  var schedule = job.schedule;
  
  job._scheduleId = new cron.CronJob(schedule, function fireJob(){
    self.emit(job.event, job.data);
  });
  
  jobs.push(job);
  self.config.set('jobs', jobs);
  self.config.save();
  
};

ScheduleHook.prototype.removeJob = function(job, hook) {
  var self = this;
  
  var jobname = (typeof job == 'object') ? job.name : job;
  if(!jobname)
    return self.log("Warning: no job name found in "+util.inspect(job)+". Can't remove any job!");
  
  var jobs = self.config.get('jobs') || [];
  
  jobs = jobs.map(function(job){return job.name!== jobname;});
    
  self.config.set('jobs', jobs);
  self.config.save();
};

exports.ScheduleHook = Hook;